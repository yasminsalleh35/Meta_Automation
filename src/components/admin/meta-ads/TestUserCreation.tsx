
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, TestTube, Loader2 } from 'lucide-react';

interface TestUserCreationProps {
  onUserCreated: () => void;
  globalConfigValid: boolean;
}

export const TestUserCreation: React.FC<TestUserCreationProps> = ({
  onUserCreated,
  globalConfigValid
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    businessName: '',
    businessDescription: '',
    password: ''
  });

  const generateTestPassword = () => {
    const password = 'Test@' + Math.random().toString(36).slice(-8);
    setFormData(prev => ({ ...prev, password }));
  };

  const handleCreateTestUser = async () => {
    if (!formData.email || !formData.name || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Email, nome e senha são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!globalConfigValid) {
      toast({
        title: "Configuração incompleta",
        description: "Configure as credenciais globais do Meta App primeiro.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create test user via edge function
      const response = await fetch('/api/admin/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          businessName: formData.businessName || `${formData.name} Test Business`,
          businessDescription: formData.businessDescription || 'Empresa criada para teste da plataforma Camply',
          isTestUser: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar usuário de teste');
      }

      const result = await response.json();

      toast({
        title: "Usuário de teste criado!",
        description: `${formData.name} foi criado com sucesso. Senha: ${formData.password}`,
      });

      // Reset form
      setFormData({
        email: '',
        name: '',
        businessName: '',
        businessDescription: '',
        password: ''
      });

      onUserCreated();
    } catch (error: any) {
      console.error('Error creating test user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário de teste.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Criar Usuário de Teste para Meta
          <Badge variant="outline" className="ml-2">Demo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="teste@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Nome do usuário"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName">Nome do Negócio</Label>
          <Input
            id="businessName"
            placeholder="Nome da empresa (opcional)"
            value={formData.businessName}
            onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessDescription">Descrição do Negócio</Label>
          <Textarea
            id="businessDescription"
            placeholder="Descrição da empresa (opcional)"
            value={formData.businessDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <div className="flex gap-2">
            <Input
              id="password"
              type="text"
              placeholder="Senha para o usuário"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
            <Button
              type="button"
              variant="outline"
              onClick={generateTestPassword}
              className="whitespace-nowrap"
            >
              Gerar
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p>• Usuário terá role de 'user' normal</p>
            <p>• Integração Meta Ads será configurada automaticamente</p>
            <p>• Dados de negócio serão pré-preenchidos</p>
          </div>
          
          <Button
            onClick={handleCreateTestUser}
            disabled={isCreating || !globalConfigValid}
            className="ml-4"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Criar Usuário
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
