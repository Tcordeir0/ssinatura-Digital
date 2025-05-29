
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Shield, PenTool, Upload, Users, Lock } from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';
import SignatureCreator from '@/components/SignatureCreator';
import DocumentManager from '@/components/DocumentManager';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const { toast } = useToast();

  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
    toast({
      title: "Login realizado com sucesso!",
      description: `Bem-vindo ao sistema, ${username}`,
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Sistema de Assinatura Digital
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plataforma segura para assinatura digital de documentos corporativos com proteção avançada contra falsificação
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <PenTool className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-gray-800">Assinatura Segura</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Crie assinaturas digitais únicas com proteção contra cópia e falsificação
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-gray-800">Documentos PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Assine holerites, contratos, admissões, rescisões e documentos de férias
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-gray-800">Controle Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Sistema administrativo com controle completo sobre assinaturas e documentos
                </p>
              </CardContent>
            </Card>
          </div>

          <AdminLogin onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 mt-2">Bem-vindo, {currentUser}</p>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Sair
          </Button>
        </div>

        <Tabs defaultValue="signatures" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="signatures" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signatures">
            <SignatureCreator />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
