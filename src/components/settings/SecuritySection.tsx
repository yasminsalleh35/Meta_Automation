import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Separator } from '@/components/ui/separator';

export const SecuritySection: React.FC = () => {
  const { updating, changePassword } = useUserProfile();
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      return;
    }

    if (passwords.newPassword.length < 6) {
      return;
    }

    const success = await changePassword(passwords.newPassword);
    if (success) {
      setPasswords({ newPassword: '', confirmPassword: '' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordsMatch = passwords.newPassword === passwords.confirmPassword;
  const passwordValid = passwords.newPassword.length >= 6;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="Sua nova senha"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwords.newPassword && !passwordValid && (
                <p className="text-sm text-destructive">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwords.confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">
                  As senhas não coincidem
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={updating || !passwordValid || !passwordsMatch || !passwords.newPassword || !passwords.confirmPassword}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Segurança</CardTitle>
          <CardDescription>
            Configurações adicionais de segurança (em desenvolvimento)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center py-6">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Em Breve</h3>
              <p className="text-sm text-muted-foreground">
                Autenticação de dois fatores e outras configurações de segurança
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};