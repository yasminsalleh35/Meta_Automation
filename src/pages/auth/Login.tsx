
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight, Users, Target, TrendingUp, Zap } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      console.log('Login: User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || loading) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Login: Attempting login with email:', email);
      await login(email, password);
      console.log('Login: Login successful');
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });
      
      // A navegação será feita pelo useEffect quando isAuthenticated mudar
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
      
      if (error?.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email ou senha incorretos.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Por favor, confirme seu email antes de fazer login.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        }
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-camply-blue to-camply-green">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-camply-blue via-blue-500 to-camply-green relative overflow-hidden">
      {/* Background Pattern - Updated with Camply colors */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-camply-yellow rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-camply-green rounded-full blur-3xl"></div>
      </div>

      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
          <div className="text-center text-white z-10 max-w-lg">
            <div className="mb-8">
              <img 
                src="/assets/images/1952e99c-e76f-41a2-909b-722e20f847cb.png" 
                alt="Camply" 
                className="h-16 w-auto mx-auto mb-6 drop-shadow-lg"
              />
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                Transforme seu
                <span className="block bg-gradient-to-r from-camply-yellow to-camply-green bg-clip-text text-transparent">
                  Marketing Digital
                </span>
              </h1>
              <p className="text-xl opacity-90 mb-8">
                Gestão inteligente de campanhas que convertem visitantes em clientes
              </p>
            </div>

            {/* Features - Updated with yellow accents */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-camply-yellow/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-camply-yellow/30">
                  <Users className="h-6 w-6 text-camply-yellow" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">+50k</div>
                  <div className="text-sm opacity-80">Leads Gerados</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-camply-yellow/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-camply-yellow/30">
                  <Target className="h-6 w-6 text-camply-yellow" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">85%</div>
                  <div className="text-sm opacity-80">Taxa de Conversão</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-camply-yellow/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-camply-yellow/30">
                  <TrendingUp className="h-6 w-6 text-camply-yellow" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">300%</div>
                  <div className="text-sm opacity-80">ROI Médio</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-camply-yellow/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-camply-yellow/30">
                  <Zap className="h-6 w-6 text-camply-yellow" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">24h</div>
                  <div className="text-sm opacity-80">Setup Rápido</div>
                </div>
              </div>
            </div>

            {/* Trust Badge - Enhanced with subtle yellow accent */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-camply-yellow to-camply-green opacity-60"></div>
              <p className="text-sm italic opacity-90">
                "A Camply revolucionou nossa estratégia de marketing. 
                Aumentamos nossos leads em 400% no primeiro mês!"
              </p>
              <p className="text-xs mt-2 opacity-70">
                - Maria Silva, CEO TechStart
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="lg:hidden mb-6">
                  <img 
                    src="/assets/images/1952e99c-e76f-41a2-909b-722e20f847cb.png" 
                    alt="Camply" 
                    className="h-12 w-auto mx-auto mb-4"
                  />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h2>
                <p className="text-gray-600">
                  Entre na sua conta para acessar o painel
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                    <div className="relative">
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
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
                </div>

                <div className="flex items-center justify-between">
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-sm text-camply-blue hover:text-camply-blue/80 font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                {/* Updated button with new color scheme */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 shadow-lg group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Entrar</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Não tem uma conta?{' '}
                  <Link 
                    to="/auth/register" 
                    className="text-camply-blue hover:text-camply-blue/80 font-semibold transition-colors"
                  >
                    Criar conta
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

export default Login;
