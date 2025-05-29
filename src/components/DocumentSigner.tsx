
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PenTool, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: string;
  file: File | null;
  signedVersion?: string;
  uploadDate: string;
}

interface Signature {
  id: string;
  name: string;
  data: string;
  hash: string;
}

interface DocumentSignerProps {
  document: Document;
  onBack: () => void;
  onSigned: (document: Document) => void;
}

const DocumentSigner: React.FC<DocumentSignerProps> = ({ document, onBack, onSigned }) => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<string>('');
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 80 });
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const savedSignatures = localStorage.getItem('digitalSignatures');
    if (savedSignatures) {
      setSignatures(JSON.parse(savedSignatures));
    }

    // Create object URL for PDF if file exists
    if (document.file) {
      const url = URL.createObjectURL(document.file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [document.file]);

  const handleSignDocument = () => {
    if (!selectedSignature) {
      toast({
        title: "Selecione uma assinatura",
        description: "Por favor, selecione uma assinatura para aplicar ao documento",
        variant: "destructive",
      });
      return;
    }

    const selectedSig = signatures.find(sig => sig.id === selectedSignature);
    if (!selectedSig) return;

    // In a real implementation, this would apply the signature to the PDF
    // For demo purposes, we'll just mark it as signed
    const signedDocument = {
      ...document,
      signedVersion: `signed_${Date.now()}_${selectedSig.hash}`,
    };

    onSigned(signedDocument);

    toast({
      title: "Documento assinado!",
      description: `O documento "${document.name}" foi assinado com sucesso`,
    });
  };

  const handlePositionChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSignaturePosition({ x, y });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assinar Documento</h2>
          <p className="text-gray-600">{document.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Visualização do Documento</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative bg-white border-2 border-gray-300 rounded-lg h-[600px] overflow-hidden cursor-crosshair"
                onClick={handlePositionChange}
              >
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="Document Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p>Visualização do documento</p>
                      <p className="text-sm mt-2">Clique para posicionar a assinatura</p>
                    </div>
                  </div>
                )}
                
                {/* Signature preview */}
                {selectedSignature && (
                  <div 
                    className="absolute pointer-events-none border-2 border-red-500 border-dashed rounded bg-red-50/50 p-2"
                    style={{
                      left: `${signaturePosition.x}%`,
                      top: `${signaturePosition.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="text-xs text-red-600 font-medium bg-white px-1 rounded">
                      Assinatura aqui
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                <PenTool className="h-5 w-5" />
                Configurações de Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Selecionar Assinatura
                </label>
                <Select value={selectedSignature} onValueChange={setSelectedSignature}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma assinatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {signatures.map((signature) => (
                      <SelectItem key={signature.id} value={signature.id}>
                        {signature.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSignature && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Preview da Assinatura
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-white">
                    <img 
                      src={signatures.find(s => s.id === selectedSignature)?.data}
                      alt="Signature preview"
                      className="max-h-16 mx-auto"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Posição da Assinatura
                </label>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p>X: {signaturePosition.x.toFixed(1)}%</p>
                  <p>Y: {signaturePosition.y.toFixed(1)}%</p>
                  <p className="mt-2 text-xs">
                    Clique no documento para reposicionar
                  </p>
                </div>
              </div>

              {signatures.length === 0 && (
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Nenhuma assinatura encontrada. Crie uma assinatura primeiro na aba "Assinaturas".
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleSignDocument}
                  disabled={!selectedSignature || signatures.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Assinar Documento
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Informações do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Nome:</p>
                <p className="text-sm text-gray-600">{document.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Tipo:</p>
                <p className="text-sm text-gray-600">{document.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Data de Upload:</p>
                <p className="text-sm text-gray-600">{document.uploadDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status:</p>
                <p className="text-sm text-gray-600">
                  {document.signedVersion ? '✓ Assinado' : 'Aguardando assinatura'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentSigner;
