
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Download, Trash2, PenTool } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DocumentSigner from '@/components/DocumentSigner';

interface Document {
  id: string;
  name: string;
  type: string;
  file: File;
  signedVersion?: string;
  uploadDate: string;
}

const DocumentManager = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [selectedDocumentForSigning, setSelectedDocumentForSigning] = useState<Document | null>(null);
  const { toast } = useToast();

  const documentTypes = [
    { value: 'holerite', label: 'Holerite' },
    { value: 'admissao', label: 'Contrato de Admissão' },
    { value: 'rescisao', label: 'Termo de Rescisão' },
    { value: 'ferias', label: 'Documento de Férias' },
    { value: 'outros', label: 'Outros' }
  ];

  useEffect(() => {
    const savedDocuments = localStorage.getItem('uploadedDocuments');
    if (savedDocuments) {
      // Note: Files cannot be stored in localStorage, so we'll just show the metadata
      const docs = JSON.parse(savedDocuments);
      setDocuments(docs.map((doc: any) => ({ ...doc, file: null })));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setDocumentName(file.name.replace('.pdf', ''));
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione apenas arquivos PDF",
          variant: "destructive",
        });
      }
    }
  };

  const uploadDocument = () => {
    if (!selectedFile || !documentType || !documentName.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos e selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    const newDocument: Document = {
      id: Date.now().toString(),
      name: documentName,
      type: documentType,
      file: selectedFile,
      uploadDate: new Date().toLocaleDateString('pt-BR')
    };

    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    
    // Save metadata to localStorage (without the file object)
    const documentsForStorage = updatedDocuments.map(doc => ({
      ...doc,
      file: null // Don't store the file object
    }));
    localStorage.setItem('uploadedDocuments', JSON.stringify(documentsForStorage));

    setSelectedFile(null);
    setDocumentType('');
    setDocumentName('');

    toast({
      title: "Documento enviado!",
      description: `Documento "${documentName}" foi enviado com sucesso`,
    });
  };

  const deleteDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    
    const documentsForStorage = updatedDocuments.map(doc => ({
      ...doc,
      file: null
    }));
    localStorage.setItem('uploadedDocuments', JSON.stringify(documentsForStorage));

    toast({
      title: "Documento removido",
      description: "Documento foi removido com sucesso",
    });
  };

  const getTypeLabel = (type: string) => {
    const typeObj = documentTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (selectedDocumentForSigning) {
    return (
      <DocumentSigner 
        document={selectedDocumentForSigning}
        onBack={() => setSelectedDocumentForSigning(null)}
        onSigned={(signedDocument) => {
          const updatedDocuments = documents.map(doc => 
            doc.id === signedDocument.id ? signedDocument : doc
          );
          setDocuments(updatedDocuments);
          setSelectedDocumentForSigning(null);
          
          const documentsForStorage = updatedDocuments.map(doc => ({
            ...doc,
            file: null
          }));
          localStorage.setItem('uploadedDocuments', JSON.stringify(documentsForStorage));
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-gray-800">
            <Upload className="h-6 w-6" />
            Enviar Novo Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="documentName">Nome do Documento</Label>
            <Input
              id="documentName"
              placeholder="Ex: Holerite Janeiro 2024"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo PDF</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo PDF'}
                </p>
              </label>
            </div>
          </div>

          <Button 
            onClick={uploadDocument}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Enviar Documento
          </Button>
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Documentos Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <FileText className="h-8 w-8 text-red-500 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-800">{document.name}</h3>
                        <p className="text-sm text-gray-500">{getTypeLabel(document.type)}</p>
                        <p className="text-sm text-gray-500">Enviado em: {document.uploadDate}</p>
                        {document.signedVersion && (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                            ✓ Assinado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedDocumentForSigning(document)}
                        className="flex items-center gap-1"
                        disabled={!document.file}
                      >
                        <PenTool className="h-3 w-3" />
                        Assinar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteDocument(document.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentManager;
