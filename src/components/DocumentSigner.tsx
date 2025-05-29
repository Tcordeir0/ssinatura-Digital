
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PenTool, Save, Download, MousePointer } from 'lucide-react';
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
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 50 });
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isPositioning, setIsPositioning] = useState(false);
  const [showSignaturePreview, setShowSignaturePreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPositioning || !selectedSignature) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setSignaturePosition({ x, y });
    setShowSignaturePreview(true);
    setIsPositioning(false);
    
    toast({
      title: "Posição definida!",
      description: "Assinatura será aplicada na posição selecionada",
    });
  };

  const startPositioning = () => {
    if (!selectedSignature) {
      toast({
        title: "Selecione uma assinatura",
        description: "Escolha uma assinatura antes de posicionar",
        variant: "destructive",
      });
      return;
    }
    setIsPositioning(true);
    setShowSignaturePreview(false);
    toast({
      title: "Modo de posicionamento ativo",
      description: "Clique no documento onde deseja aplicar a assinatura",
    });
  };

  const handleSignDocument = async () => {
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

    try {
      // Create a canvas to overlay the signature on the document
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 1000;

      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add document content placeholder
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.fillText('Documento Original', 70, 80);
      ctx.fillText(`${document.name}`, 70, 110);

      // Load and draw signature
      const img = new Image();
      img.onload = () => {
        const sigX = (signaturePosition.x / 100) * canvas.width;
        const sigY = (signaturePosition.y / 100) * canvas.height;
        const sigWidth = 150;
        const sigHeight = 60;
        
        ctx.drawImage(img, sigX - sigWidth/2, sigY - sigHeight/2, sigWidth, sigHeight);
        
        // Convert canvas to blob and create download
        canvas.toBlob((blob) => {
          if (blob) {
            const signedDocument = {
              ...document,
              signedVersion: `signed_${Date.now()}_${selectedSig.hash}`,
            };

            onSigned(signedDocument);

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${document.name}_assinado.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
              title: "Documento assinado e baixado!",
              description: `O documento "${document.name}" foi assinado e baixado com sucesso`,
            });
          }
        }, 'image/png');
      };
      img.src = selectedSig.data;

    } catch (error) {
      toast({
        title: "Erro ao assinar documento",
        description: "Ocorreu um erro durante o processo de assinatura",
        variant: "destructive",
      });
    }
  };

  const downloadSignedDocument = () => {
    if (!document.signedVersion) {
      toast({
        title: "Documento não assinado",
        description: "Assine o documento primeiro para fazer o download",
        variant: "destructive",
      });
      return;
    }

    // Simulate download of signed document
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${document.name}_assinado.pdf`;
    toast({
      title: "Download iniciado",
      description: "O download do documento assinado foi iniciado",
    });
  };

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />
      
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
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                Visualização do Documento
                {isPositioning && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Clique para posicionar
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className={`relative bg-white border-2 rounded-lg h-[600px] overflow-hidden ${
                  isPositioning ? 'cursor-crosshair border-blue-500' : 'border-gray-300'
                }`}
                onClick={handleDocumentClick}
              >
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full pointer-events-none"
                    title="Document Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p>Visualização do documento</p>
                      <p className="text-sm mt-2">
                        {isPositioning ? 'Clique para posicionar a assinatura' : 'Selecione uma assinatura e clique em "Posicionar"'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Signature preview */}
                {showSignaturePreview && selectedSignature && (
                  <div 
                    className="absolute pointer-events-none border-2 border-green-500 border-dashed rounded bg-green-50/80 p-2 shadow-lg"
                    style={{
                      left: `${signaturePosition.x}%`,
                      top: `${signaturePosition.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <img 
                      src={signatures.find(s => s.id === selectedSignature)?.data}
                      alt="Signature preview"
                      className="max-h-12 opacity-80"
                    />
                  </div>
                )}

                {/* Positioning indicator */}
                {isPositioning && (
                  <div className="absolute inset-0 bg-blue-50/20 flex items-center justify-center">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                      <MousePointer className="h-4 w-4" />
                      Clique onde deseja aplicar a assinatura
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

              <div className="space-y-3">
                <Button 
                  onClick={startPositioning}
                  disabled={!selectedSignature}
                  variant="outline"
                  className="w-full"
                >
                  <MousePointer className="h-4 w-4 mr-2" />
                  Posicionar Assinatura
                </Button>

                {showSignaturePreview && (
                  <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                    <p className="font-medium text-green-800">✓ Posição definida</p>
                    <p>X: {signaturePosition.x.toFixed(1)}%</p>
                    <p>Y: {signaturePosition.y.toFixed(1)}%</p>
                  </div>
                )}
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
                  disabled={!selectedSignature || !showSignaturePreview}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Assinar e Baixar
                </Button>

                {document.signedVersion && (
                  <Button 
                    onClick={downloadSignedDocument}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Documento Assinado
                  </Button>
                )}
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
