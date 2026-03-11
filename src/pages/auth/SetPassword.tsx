import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';

const SetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const supabase = useSupabase();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Obter email do usuário atual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        // Se não há usuário, redirecionar para login
        navigate('/auth/login', { replace: true });
      }
    };

    getUser();
  }, [supabase, navigate]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres';
    }
    if (pwd.length > 72) {
      return 'A senha deve ter no máximo 72 caracteres';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;

    // Validar senha
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast({
        title: "Senha inválida",
        description: passwordError,
        variant: "destructive"
      });
      return;
    }

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('[SetPassword] Updating user password...');
      
      // Atualizar senha do usuário
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('[SetPassword] Error updating password:', error);
        throw error;
      }

      console.log('[SetPassword] Password updated successfully');
      
      toast({
        title: "Senha definida com sucesso!",
        description: "Você já pode acessar sua conta.",
      });

      // Redirecionar para dashboard após sucesso
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);

    } catch (error: any) {
      console.error('[SetPassword] Error:', error);
      
      let errorMessage = "Erro ao definir senha. Tente novamente.";
      
      if (error?.message) {
        if (error.message.includes('same as the old password')) {
          errorMessage = "A nova senha não pode ser igual à senha anterior.";
        } else if (error.message.includes('Password should be')) {
          errorMessage = "A senha não atende aos requisitos mínimos de segurança.";
        }
      }
      
      toast({
        title: "Erro ao definir senha",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'Muito fraca', color: 'bg-red-500', width: '25%' };
    if (pwd.length < 8) return { label: 'Fraca', color: 'bg-orange-500', width: '50%' };
    if (pwd.length < 12) return { label: 'Boa', color: 'bg-yellow-500', width: '75%' };
    return { label: 'Forte', color: 'bg-green-500', width: '100%' };
  };

  const strength = passwordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-camply-blue via-blue-500 to-camply-green">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/assets/images/1952e99c-e76f-41a2-909b-722e20f847cb.png" 
                alt="Camply" 
                className="h-12 w-auto mx-auto mb-4"
              />
            </div>
            <div className="w-16 h-16 bg-camply-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-camply-blue" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Definir Senha</h2>
            <p className="text-gray-600">
              Crie uma senha segura para acessar sua conta
            </p>
            {userEmail && (
              <p className="text-sm text-gray-500 mt-2">
                {userEmail}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={72}
                    className="h-12 pl-4 pr-12 text-base border-gray-200 focus:border-camply-blue focus:ring-camply-blue/20 rounded-xl transition-all duration-200"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Força da senha: <span className="font-medium">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 pl-4 pr-12 text-base border-gray-200 focus:border-camply-blue focus:ring-camply-blue/20 rounded-xl transition-all duration-200"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-xs text-green-600 font-medium">Senhas coincidem</p>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <p className="text-xs text-red-600 font-medium">Senhas não coincidem</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
              disabled={isLoading || password !== confirmPassword || password.length < 6}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </div>
              ) : (
                'Definir Senha e Continuar'
              )}
            </Button>

            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Requisitos da senha:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center space-x-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>Mínimo de 6 caracteres</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 12 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span>Recomendado: 12 caracteres ou mais</span>
                </li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPassword;
