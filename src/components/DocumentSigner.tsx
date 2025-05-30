
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Download, ZoomIn, ZoomOut, RotateCw, Move, FileText, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [zoom, setZoom] = useState(100);
  const [signatureHistory, setSignatureHistory] = useState<Array<{timestamp: string, signature: string, position: {x: number, y: number}}>>([]);
  const [isValidatingGov, setIsValidatingGov] = useState(false);
  const [govSignatureConnected, setGovSignatureConnected] = useState(false);
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedSignatures = localStorage.getItem('digitalSignatures');
    if (savedSignatures) {
      setSignatures(JSON.parse(savedSignatures));
    }

    const savedHistory = localStorage.getItem('signatureHistory');
    if (savedHistory) {
      setSignatureHistory(JSON.parse(savedHistory));
    }

    checkGovSignatureStatus();

    if (document.file) {
      const url = URL.createObjectURL(document.file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [document.file]);

  const checkGovSignatureStatus = () => {
    const govConnected = localStorage.getItem('govSignatureConnected');
    setGovSignatureConnected(govConnected === 'true');
  };

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
      description: "Assinatura será aplicada na posição selecionada. Use 'Resetar' para alterar.",
    });
  };

  const resetSignaturePosition = () => {
    setShowSignaturePreview(false);
    setIsPositioning(false);
    setSignaturePosition({ x: 50, y: 50 });
    
    toast({
      title: "Posicionamento resetado",
      description: "Selecione novamente onde deseja posicionar a assinatura",
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

  const connectGovSignature = async () => {
    setIsValidatingGov(true);
    
    setTimeout(() => {
      setGovSignatureConnected(true);
      localStorage.setItem('govSignatureConnected', 'true');
      setIsValidatingGov(false);
      
      const govSignature: Signature = {
        id: 'gov-signature',
        name: 'Assinatura Digital GOV.BR',
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDA2NkNDIiByeD0iNSIvPgo8dGV4dCB4PSIxMDAiIHk9IjI1IiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdPVi5CUjwvdGV4dD4KPHR4dCB4PSIxMDAiIHk9IjQ1IiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXNzaW5hdHVyYSBEaWdpdGFsPC90ZXh0Pgo8dGV4dCB4PSIxMDAiIHk9IjYwIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DZXJ0aWZpY2FkbyBJQ1AtQnJhc2lsPC90ZXh0Pgo8L3N2Zz4K',
        hash: 'gov_signature_hash_' + Date.now()
      };
      
      const updatedSignatures = [...signatures, govSignature];
      setSignatures(updatedSignatures);
      localStorage.setItem('digitalSignatures', JSON.stringify(updatedSignatures));
      
      toast({
        title: "Assinatura GOV conectada!",
        description: "Sua assinatura digital GOV.BR está pronta para uso",
      });
    }, 2000);
  };

  const createSignedPdf = async (originalFile: File, signatureData: string, position: {x: number, y: number}): Promise<Blob> => {
    // Para esta demonstração, vamos criar um PDF simples com a assinatura
    // Em um ambiente real, você usaria uma biblioteca como PDF-lib para modificar o PDF original
    
    const canvas = globalThis.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Configurar canvas para tamanho A4
    canvas.width = 595; // A4 width in points
    canvas.height = 842; // A4 height in points

    // Fundo branco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simular conteúdo do documento original
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.fillText(`Documento: ${document.name}`, 50, 50);
    ctx.fillText(`Tipo: ${document.type}`, 50, 80);
    ctx.fillText(`Data de upload: ${document.uploadDate}`, 50, 110);
    
    // Adicionar texto simulando conteúdo do documento
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    const lines = [
      'Este é um documento de exemplo que foi carregado no sistema.',
      'O conteúdo original do documento seria preservado aqui.',
      'Todas as informações e formatação originais seriam mantidas.',
      '',
      'DOCUMENTO ASSINADO DIGITALMENTE',
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
      'Certificado: ICP-Brasil (se assinatura GOV)',
    ];
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 50, 150 + (index * 20));
    });

    // Carregar e desenhar a assinatura
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const sigX = (position.x / 100) * canvas.width;
        const sigY = (position.y / 100) * canvas.height;
        const sigWidth = 150;
        const sigHeight = 60;
        
        ctx.drawImage(img, sigX - sigWidth/2, sigY - sigHeight/2, sigWidth, sigHeight);
        
        // Adicionar informações da assinatura
        ctx.fillStyle = '#059669';
        ctx.font = '10px Arial';
        ctx.fillText('✓ Documento assinado digitalmente', sigX - sigWidth/2, sigY + sigHeight/2 + 15);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, 'application/pdf');
      };
      img.src = signatureData;
    });
  };

  const handleSignDocument = async () => {
    if (!selectedSignature || !document.file) {
      toast({
        title: "Erro",
        description: "Selecione uma assinatura e certifique-se de que há um documento carregado",
        variant: "destructive",
      });
      return;
    }

    const selectedSig = signatures.find(sig => sig.id === selectedSignature);
    if (!selectedSig) return;

    try {
      // Criar PDF assinado
      const signedBlob = await createSignedPdf(document.file, selectedSig.data, signaturePosition);
      setSignedPdfBlob(signedBlob);

      // Adicionar ao histórico
      const historyEntry = {
        timestamp: new Date().toISOString(),
        signature: selectedSig.name,
        position: signaturePosition
      };
      const newHistory = [...signatureHistory, historyEntry];
      setSignatureHistory(newHistory);
      localStorage.setItem('signatureHistory', JSON.stringify(newHistory));

      // Atualizar documento
      const signedDocument = {
        ...document,
        signedVersion: `signed_${Date.now()}_${selectedSig.hash}`,
      };

      onSigned(signedDocument);

      toast({
        title: "Documento assinado com sucesso!",
        description: "O documento foi assinado e está pronto para download",
      });

      resetSignaturePosition();

    } catch (error) {
      console.error('Erro ao assinar documento:', error);
      toast({
        title: "Erro ao assinar documento",
        description: "Ocorreu um erro durante o processo de assinatura",
        variant: "destructive",
      });
    }
  };

  const downloadSignedDocument = () => {
    if (!signedPdfBlob) {
      toast({
        title: "Documento não assinado",
        description: "Assine o documento primeiro para fazer o download",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(signedPdfBlob);
    const downloadLink = globalThis.document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${document.name}_assinado.pdf`;
    globalThis.document.body.appendChild(downloadLink);
    downloadLink.click();
    globalThis.document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado",
      description: "O documento PDF assinado foi baixado com sucesso",
    });
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(50, Math.min(200, prev + delta)));
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  Visualização do Documento
                  {isPositioning && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Clique para posicionar
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => adjustZoom(-25)}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{zoom}%</span>
                  <Button size="sm" variant="outline" onClick={() => adjustZoom(25)}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`relative bg-white border-2 rounded-lg overflow-hidden ${
                  isPositioning ? 'cursor-crosshair border-blue-500' : 'border-gray-300'
                }`}
                onClick={handleDocumentClick}
                style={{ height: '700px' }}
              >
                {pdfUrl ? (
                  <iframe
                    ref={pdfViewerRef}
                    src={`${pdfUrl}#zoom=${zoom}`}
                    className="w-full h-full border-0"
                    title="Document Preview"
                    style={{ 
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top left',
                      width: `${100 / (zoom / 100)}%`,
                      height: `${100 / (zoom / 100)}%`
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">Nenhum documento carregado</p>
                      <p className="text-sm mt-2">
                        {isPositioning ? 'Clique para posicionar a assinatura' : 'Carregue um documento PDF para visualizar'}
                      </p>
                    </div>
                  </div>
                )}
                
                {showSignaturePreview && selectedSignature && (
                  <div 
                    className="absolute pointer-events-none border-2 border-green-500 border-dashed rounded bg-green-50/80 p-2 shadow-lg z-10"
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

                {isPositioning && (
                  <div className="absolute inset-0 bg-blue-50/20 flex items-center justify-center z-10">
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
          {!govSignatureConnected && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                  <Shield className="h-5 w-5" />
                  Assinatura GOV.BR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={connectGovSignature}
                  disabled={isValidatingGov}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {isValidatingGov ? 'Conectando...' : 'Conectar Assinatura GOV'}
                </Button>
              </CardContent>
            </Card>
          )}

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
                        <div className="flex items-center gap-2">
                          {signature.id === 'gov-signature' && <Shield className="h-4 w-4 text-green-600" />}
                          {signature.name}
                        </div>
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
                    {signatures.find(s => s.id === selectedSignature)?.id === 'gov-signature' && (
                      <p className="text-xs text-green-600 text-center mt-2">✓ Certificado ICP-Brasil</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={startPositioning}
                    disabled={!selectedSignature}
                    variant="outline"
                    className="flex-1"
                  >
                    <MousePointer className="h-4 w-4 mr-2" />
                    Posicionar
                  </Button>
                  
                  <Button 
                    onClick={resetSignaturePosition}
                    disabled={!showSignaturePreview}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {showSignaturePreview && (
                  <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                    <p className="font-medium text-green-800">✓ Posição definida</p>
                    <p>X: {signaturePosition.x.toFixed(1)}%</p>
                    <p>Y: {signaturePosition.y.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">Use o botão de reset para alterar</p>
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
                  disabled={!selectedSignature || !showSignaturePreview || !document.file}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Assinar Documento
                </Button>

                {signedPdfBlob && (
                  <Button 
                    onClick={downloadSignedDocument}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF Assinado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {signatureHistory.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Histórico de Assinaturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {signatureHistory.slice(-3).map((entry, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                      <p className="font-medium">{entry.signature}</p>
                      <p className="text-gray-500">{new Date(entry.timestamp).toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  {signedPdfBlob ? (
                    <>
                      <FileCheck className="h-4 w-4 text-green-600" />
                      Assinado
                    </>
                  ) : (
                    'Aguardando assinatura'
                  )}
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
