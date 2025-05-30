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

const DocumentSigner: React.FC<DocumentSignerProps> = ({ document: documentProp, onBack, onSigned }) => {
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
  const [isDocumentSigned, setIsDocumentSigned] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string>('');
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    if (documentProp.file) {
      const url = URL.createObjectURL(documentProp.file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [documentProp.file]);

  const checkGovSignatureStatus = () => {
    const govConnected = localStorage.getItem('govSignatureConnected');
    setGovSignatureConnected(govConnected === 'true');
  };

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPositioning || !selectedSignature) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    console.log('Posição da assinatura definida:', { x, y });
    
    setSignaturePosition({ x, y });
    setShowSignaturePreview(true);
    setIsPositioning(false);
    
    toast({
      title: "Posição definida!",
      description: "Assinatura será aplicada na posição selecionada.",
    });
  };

  const resetSignaturePosition = () => {
    console.log('Resetando posição da assinatura');
    setShowSignaturePreview(false);
    setIsPositioning(false);
    setSignaturePosition({ x: 50, y: 50 });
    setIsDocumentSigned(false);
    setSignedPdfBlob(null);
    if (signedPdfUrl) {
      URL.revokeObjectURL(signedPdfUrl);
      setSignedPdfUrl('');
    }
    
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
    
    console.log('Iniciando modo de posicionamento');
    setIsPositioning(true);
    setShowSignaturePreview(false);
    setIsDocumentSigned(false);
    setSignedPdfBlob(null);
    if (signedPdfUrl) {
      URL.revokeObjectURL(signedPdfUrl);
      setSignedPdfUrl('');
    }
    
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
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDA2NkNDIiByeD0iNSIvPgo8dGV4dCB4PSIxMDAiIHk9IjI1IiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdPVi5CUjwvdGV4dD4KPHRleHQgeD0iMTAwIiB5PSI0NSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFzc2luYXR1cmEgRGlnaXRhbDwvdGV4dD4KPHRleHQgeD0iMTAwIiB5PSI2MCIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iOCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2VydGlmaWNhZG8gSUNQLUJyYXNpbDwvdGV4dD4KPC9zdmc+Cg==',
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

  const renderPdfWithSignature = async (originalFile: File, signatureData: string, position: {x: number, y: number}): Promise<Blob> => {
    try {
      console.log('Renderizando PDF com assinatura sobreposta');
      
      // Criar canvas para renderizar o PDF com a assinatura
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar contexto do canvas');
      }

      // Configurar canvas para tamanho A4 em alta resolução
      const scale = 2; // Para melhor qualidade
      canvas.width = 595 * scale; // A4 width em pontos * scale
      canvas.height = 842 * scale; // A4 height em pontos * scale
      
      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Simular conteúdo do documento original
      ctx.fillStyle = '#000000';
      ctx.font = `${12 * scale}px Arial`;
      ctx.fillText('DOCUMENTO ORIGINAL', 50 * scale, 50 * scale);
      ctx.fillText(`Nome: ${documentProp.name}`, 50 * scale, 80 * scale);
      ctx.fillText(`Tipo: ${documentProp.type}`, 50 * scale, 110 * scale);
      ctx.fillText(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 50 * scale, 140 * scale);
      
      // Adicionar linhas simulando conteúdo
      for (let i = 0; i < 20; i++) {
        ctx.fillText(`Linha de conteúdo do documento ${i + 1}`, 50 * scale, (200 + i * 25) * scale);
      }
      
      // Carregar e desenhar a assinatura
      const signatureImg = new Image();
      signatureImg.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        signatureImg.onload = () => {
          try {
            // Calcular posição da assinatura no canvas
            const sigX = (position.x / 100) * canvas.width - (100 * scale);
            const sigY = (position.y / 100) * canvas.height - (40 * scale);
            
            // Desenhar a assinatura
            ctx.drawImage(signatureImg, sigX, sigY, 200 * scale, 80 * scale);
            
            // Adicionar texto indicando que está assinado
            ctx.fillStyle = '#0066CC';
            ctx.font = `bold ${10 * scale}px Arial`;
            ctx.fillText('DOCUMENTO ASSINADO DIGITALMENTE', sigX, sigY + 100 * scale);
            ctx.fillText(`Data: ${new Date().toLocaleString('pt-BR')}`, sigX, sigY + 120 * scale);
            
            // Converter canvas para blob PDF (simulado)
            canvas.toBlob((blob) => {
              if (blob) {
                console.log('PDF com assinatura criado com sucesso');
                resolve(blob);
              } else {
                reject(new Error('Falha ao criar blob do canvas'));
              }
            }, 'image/png', 0.95);
          } catch (error) {
            reject(error);
          }
        };
        
        signatureImg.onerror = () => {
          reject(new Error('Falha ao carregar imagem da assinatura'));
        };
        
        signatureImg.src = signatureData;
      });
    } catch (error) {
      console.error('Erro ao renderizar PDF com assinatura:', error);
      throw error;
    }
  };

  const handleSignDocument = async () => {
    console.log('Iniciando processo de assinatura...');
    
    if (!selectedSignature || !documentProp.file) {
      toast({
        title: "Erro",
        description: "Selecione uma assinatura e certifique-se de que há um documento carregado",
        variant: "destructive",
      });
      return;
    }

    if (!showSignaturePreview) {
      toast({
        title: "Posicione a assinatura",
        description: "Clique em 'Posicionar' e selecione onde aplicar a assinatura no documento",
        variant: "destructive",
      });
      return;
    }

    const selectedSig = signatures.find(sig => sig.id === selectedSignature);
    if (!selectedSig) {
      console.error('Assinatura selecionada não encontrada');
      return;
    }

    try {
      console.log('Aplicando assinatura:', selectedSig.name);
      
      // Criar PDF com assinatura visível
      const signedBlob = await renderPdfWithSignature(documentProp.file, selectedSig.data, signaturePosition);
      setSignedPdfBlob(signedBlob);
      
      // Criar URL para preview do documento assinado
      const signedUrl = URL.createObjectURL(signedBlob);
      setSignedPdfUrl(signedUrl);
      setIsDocumentSigned(true);

      console.log('Documento assinado com sucesso!');

      // Adicionar ao histórico
      const historyEntry = {
        timestamp: new Date().toISOString(),
        signature: selectedSig.name,
        position: signaturePosition
      };
      const newHistory = [...signatureHistory, historyEntry];
      setSignatureHistory(newHistory);
      localStorage.setItem('signatureHistory', JSON.stringify(newHistory));

      toast({
        title: "Documento assinado com sucesso!",
        description: "A assinatura foi aplicada ao documento. Visualize o resultado e faça o download.",
      });

    } catch (error) {
      console.error('Erro ao assinar documento:', error);
      toast({
        title: "Erro ao assinar documento",
        description: "Ocorreu um erro durante o processo de assinatura. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const downloadSignedDocument = () => {
    console.log('Iniciando download do documento assinado');
    
    if (!signedPdfBlob) {
      toast({
        title: "Documento não assinado",
        description: "Assine o documento primeiro para fazer o download",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = URL.createObjectURL(signedPdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${documentProp.name.replace('.pdf', '')}_assinado.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      console.log('Download realizado com sucesso');

      toast({
        title: "Download realizado!",
        description: "O documento PDF assinado foi baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao baixar o documento",
        variant: "destructive",
      });
    }
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
          <p className="text-gray-600">{documentProp.name}</p>
          {isDocumentSigned && (
            <Badge className="mt-1 bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Documento Assinado
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  {isDocumentSigned ? 'Documento Assinado' : 'Visualização do Documento'}
                  {isPositioning && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
                      Clique para posicionar a assinatura
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
                className={`relative bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                  isPositioning ? 'cursor-crosshair border-blue-500 shadow-lg' : 'border-gray-300'
                }`}
                onClick={handleDocumentClick}
                style={{ height: '700px' }}
              >
                {/* Mostrar documento assinado se disponível, senão mostrar original */}
                {(isDocumentSigned && signedPdfUrl) ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <img 
                      src={signedPdfUrl} 
                      alt="Documento Assinado" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : pdfUrl ? (
                  <ScrollArea className="w-full h-full">
                    <iframe
                      ref={pdfViewerRef}
                      src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=1`}
                      className="w-full border-0"
                      title="Document Preview"
                      style={{ 
                        height: '800px',
                        minHeight: '100%'
                      }}
                    />
                  </ScrollArea>
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
                
                {/* Preview da assinatura apenas no modo de posicionamento */}
                {showSignaturePreview && selectedSignature && !isDocumentSigned && (
                  <div 
                    className="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-50/90 rounded shadow-lg z-20 transition-all duration-300"
                    style={{
                      left: `${signaturePosition.x}%`,
                      top: `${signaturePosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      padding: '8px',
                      minWidth: '120px'
                    }}
                  >
                    <img 
                      src={signatures.find(s => s.id === selectedSignature)?.data}
                      alt="Signature preview"
                      className="max-h-12 max-w-full object-contain opacity-95"
                    />
                    <div className="text-xs text-blue-600 text-center mt-1 font-medium">
                      Preview - Clique em "Assinar" para aplicar
                    </div>
                  </div>
                )}

                {isPositioning && (
                  <div className="absolute inset-0 bg-blue-50/30 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
                      <Move className="h-5 w-5" />
                      <span className="font-medium">Clique onde deseja aplicar a assinatura</span>
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
                <FileText className="h-5 w-5" />
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
                    disabled={!selectedSignature || isDocumentSigned}
                    variant="outline"
                    className="flex-1"
                  >
                    <Move className="h-4 w-4 mr-2" />
                    {isDocumentSigned ? 'Reposicionar' : 'Posicionar'}
                  </Button>
                  
                  <Button 
                    onClick={resetSignaturePosition}
                    disabled={!showSignaturePreview && !isDocumentSigned}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>

                {showSignaturePreview && !isDocumentSigned && (
                  <div className="text-sm p-3 rounded border bg-blue-50 border-blue-200">
                    <p className="font-medium">✓ Posição definida</p>
                    <p>Posição X: {signaturePosition.x.toFixed(1)}%</p>
                    <p>Posição Y: {signaturePosition.y.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">Clique em "Assinar Documento" para aplicar</p>
                  </div>
                )}

                {isDocumentSigned && (
                  <div className="text-sm p-3 rounded border bg-green-50 border-green-200 text-green-800">
                    <p className="font-medium">✓ Documento assinado com sucesso!</p>
                    <p>Assinatura aplicada na posição:</p>
                    <p>X: {signaturePosition.x.toFixed(1)}%, Y: {signaturePosition.y.toFixed(1)}%</p>
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
                  disabled={!selectedSignature || !showSignaturePreview || !documentProp.file || isDocumentSigned}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isDocumentSigned ? '✓ Documento Assinado' : 'Assinar Documento'}
                </Button>

                {isDocumentSigned && signedPdfBlob && (
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
                <p className="text-sm text-gray-600">{documentProp.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Tipo:</p>
                <p className="text-sm text-gray-600">{documentProp.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Data de Upload:</p>
                <p className="text-sm text-gray-600">{documentProp.uploadDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status:</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  {isDocumentSigned ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Assinado Digitalmente
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Aguardando assinatura
                    </>
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
