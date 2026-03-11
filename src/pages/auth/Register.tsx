
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight, Shield, Clock, Users, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    // política forte de senha unificada
    const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!STRONG.test(password)) {
      toast({
        title: "Senha muito fraca",
        description: "Use no mínimo 8 caracteres com maiúscula, minúscula, número e símbolo.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta e iniciar seu trial gratuito.",
      });
      navigate('/auth/email-confirmation', { 
        state: { 
          email,
          message: "Conta criada! Confirme seu email para começar seu trial de 14 dias.",
          nextStep: "/onboarding/welcome"
        }
      });
    } catch (error: any) {
      console.error('Register error:', error);
      
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      
      if (error?.message) {
        if (error.message.includes('already registered')) {
          errorMessage = "Este email já está em uso.";
        } else if (error.message.includes('invalid email')) {
          errorMessage = "Email inválido.";
        } else if (error.message.includes('weak password')) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        }
      }
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-camply-blue via-purple-600 to-camply-blue">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-camply-blue via-purple-600 to-camply-blue relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-camply-green rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-camply-yellow rounded-full blur-3xl"></div>
      </div>

      <div className="flex min-h-screen">
        {/* Left Side - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
          <div className="text-center text-white z-10 max-w-lg">
            <div className="mb-8">
              <img 
                src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
                alt="Camply" 
                className="h-16 w-auto mx-auto mb-6 drop-shadow-lg"
              />
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                Comece
                <span className="block bg-gradient-to-r from-camply-green to-camply-yellow bg-clip-text text-transparent">
                  Gratuitamente
                </span>
              </h1>
              <p className="text-xl opacity-90 mb-8">
                Crie sua conta e transforme suas campanhas em máquinas de conversão
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <CheckCircle className="h-6 w-6 text-camply-green" />
                <div className="text-left">
                  <div className="font-semibold">Setup em minutos</div>
                  <div className="text-sm opacity-80">Configure suas campanhas rapidamente</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Shield className="h-6 w-6 text-camply-green" />
                <div className="text-left">
                  <div className="font-semibold">Dados seguros</div>
                  <div className="text-sm opacity-80">Seus dados protegidos com criptografia</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Users className="h-6 w-6 text-camply-green" />
                <div className="text-left">
                  <div className="font-semibold">Suporte especializado</div>
                  <div className="text-sm opacity-80">Nossa equipe te ajuda a crescer</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Clock className="h-6 w-6 text-camply-green" />
                <div className="text-left">
                  <div className="font-semibold">Teste grátis por 14 dias</div>
                  <div className="text-sm opacity-80">Experimente todos os recursos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="lg:hidden mb-6">
                  <img 
                    src="/assets/images/ee751fd8-27e0-476e-9479-10ef458dbe4e.png" 
                    alt="Camply" 
                    className="h-12 w-auto mx-auto mb-4"
                  />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar conta</h2>
                <p className="text-gray-600">
                  Junte-se a milhares de empresas que já transformaram seu marketing
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 pl-4 pr-4 text-base border-gray-200 focus:border-camply-blue focus:ring-camply-blue/20 rounded-xl transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-4 pr-4 text-base border-gray-200 focus:border-camply-blue focus:ring-camply-blue/20 rounded-xl transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres com maiúscula, minúscula, número e símbolo"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
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
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-camply-blue to-purple-600 hover:from-camply-blue/90 hover:to-purple-600/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Criando conta...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Criar conta gratuitamente</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Já tem uma conta?{' '}
                  <Link 
                    to="/auth/login" 
                    className="text-camply-blue hover:text-camply-blue/80 font-semibold transition-colors"
                  >
                    Faça login
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Ao criar uma conta, você concorda com nossos{' '}
                  <Link to="/legal/terms" className="text-camply-blue hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link to="/legal/privacy" className="text-camply-blue hover:underline">
                    Política de Privacidade
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
