
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus } from 'lucide-react';

const AdminUserManager: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const makeUserAdmin = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll create a simple edge function to handle this
      // Since the types aren't updated yet, we'll use a direct fetch
      const response = await fetch('/api/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Erro ao tornar usuário administrador');
      }

      toast({
        title: "Sucesso!",
        description: `Usuário ${email} agora é administrador`,
      });

      setEmail('');
    } catch (error: any) {
      console.error('Error making user admin:', error);
      toast({
        title: "Erro",
        description: "Por enquanto, use o painel do Supabase para tornar usuários administradores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Gerenciar Administradores</span>
        </CardTitle>
        <CardDescription>
          Adicione privilégios de administrador a usuários existentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email do Usuário</Label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={makeUserAdmin}
          disabled={isLoading}
          className="w-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isLoading ? "Processando..." : "Tornar Administrador"}
        </Button>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <p><strong>Instruções temporárias:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Registre-se normalmente no sistema</li>
            <li>Use o painel do Supabase para adicionar uma linha na tabela user_roles</li>
            <li>Defina user_id como seu ID e role como 'admin' ou 'super_admin'</li>
            <li>Faça logout e login novamente</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUserManager;
