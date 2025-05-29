
import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PenTool, Save, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SignatureCreator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatures, setSignatures] = useState<Array<{id: string, name: string, data: string, hash: string}>>([]);
  const [signatureName, setSignatureName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedSignatures = localStorage.getItem('digitalSignatures');
    if (savedSignatures) {
      setSignatures(JSON.parse(savedSignatures));
    }
  }, []);

  const generateHash = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16) + Date.now().toString(16);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e40af';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !signatureName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, desenhe uma assinatura e forneça um nome",
        variant: "destructive",
      });
      return;
    }

    const dataURL = canvas.toDataURL();
    const hash = generateHash(dataURL + signatureName + Date.now());
    
    const newSignature = {
      id: Date.now().toString(),
      name: signatureName,
      data: dataURL,
      hash: hash
    };

    const updatedSignatures = [...signatures, newSignature];
    setSignatures(updatedSignatures);
    localStorage.setItem('digitalSignatures', JSON.stringify(updatedSignatures));
    
    setSignatureName('');
    clearCanvas();
    
    toast({
      title: "Assinatura salva!",
      description: `Assinatura "${signatureName}" foi salva com sucesso`,
    });
  };

  const deleteSignature = (id: string) => {
    const updatedSignatures = signatures.filter(sig => sig.id !== id);
    setSignatures(updatedSignatures);
    localStorage.setItem('digitalSignatures', JSON.stringify(updatedSignatures));
    
    toast({
      title: "Assinatura removida",
      description: "Assinatura foi removida com sucesso",
    });
  };

  const downloadSignature = (signature: any) => {
    const link = document.createElement('a');
    link.download = `assinatura_${signature.name}.png`;
    link.href = signature.data;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-gray-800">
            <PenTool className="h-6 w-6" />
            Criar Nova Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="signatureName">Nome da Assinatura</Label>
            <Input
              id="signatureName"
              placeholder="Ex: Assinatura Principal, Assinatura RH..."
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label>Desenhe sua assinatura abaixo:</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="border border-gray-200 rounded cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={clearCanvas} variant="outline" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
            <Button 
              onClick={saveSignature} 
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Save className="h-4 w-4" />
              Salvar Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>

      {signatures.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Assinaturas Salvas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {signatures.map((signature) => (
                <div key={signature.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-800">{signature.name}</h3>
                      <p className="text-sm text-gray-500">Hash: {signature.hash.substring(0, 16)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadSignature(signature)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteSignature(signature.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                  <img 
                    src={signature.data} 
                    alt={signature.name}
                    className="max-h-20 border border-gray-300 rounded bg-white p-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignatureCreator;
