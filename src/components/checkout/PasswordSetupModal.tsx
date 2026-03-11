import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordSetupModalProps {
  isOpen: boolean;
  email?: string;
  sessionId: string;
  onSuccess: () => void;
}

export const PasswordSetupModal: React.FC<PasswordSetupModalProps> = ({ 
  isOpen, 
  email, 
  sessionId,
  onSuccess 
}) => {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const MAX_RETRIES = 3;

  const callSetupPassword = async () => {
    const url = `https://ibwhqkgvrkkqxiksbiqr.supabase.co/functions/v1/setup-password`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, password }),
    });
    const data = await resp.json().catch(() => ({}));
    return { resp, data };
  };

  const handlePasswordSetup = async () => {
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", description: "Confirme sua senha corretamente.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { resp, data } = await callSetupPassword();

      // Novo: lidar com latência do webhook
      if (resp.status === 409) {
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          toast({
            title: "Aguarde um instante",
            description: "Estamos finalizando a ativação da sua conta...",
          });
          setAttempt((a) => a + 1);
          setTimeout(handlePasswordSetup, delay);
          return;
        } else {
          throw new Error("A ativação ainda está em processamento. Tente novamente em alguns segundos.");
        }
      }

      if (!resp.ok || data?.error) {
        throw new Error(data?.error || 'Falha ao configurar senha');
      }

      // sucesso → login direto
      const emailToUse = data.email as string;
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      if (signInErr) throw signInErr;

      toast({ title: "Senha configurada!", description: "Sua conta foi ativada com sucesso." });
      onSuccess();
    } catch (error) {
      console.error('Erro ao configurar senha:', error);
      toast({
        title: "Erro ao configurar senha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900">
            Configure sua Senha
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-camply-blue to-camply-green rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600">
              Seu pagamento foi confirmado! Agora configure uma senha para acessar sua conta.
            </p>
            {email && (
              <p className="text-sm text-gray-500 mt-2">
                Email: <strong>{email}</strong>
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-sm text-gray-700">
                Nova Senha (mínimo 6 caracteres)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm text-gray-700">
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handlePasswordSetup}
            disabled={isLoading || !password || !confirmPassword}
            className="w-full h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg group"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Configurando...
              </div>
            ) : (
              <>
                <span>Ativar Conta</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>

          <div className="text-center text-xs text-gray-500">
            🔒 Sua senha é criptografada e totalmente segura
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};