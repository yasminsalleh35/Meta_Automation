import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/hooks/useSupabase';
import { useRecoveryState } from '@/hooks/useRecoveryState';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const supabase = useSupabase();
  const { isActiveRecovery, hasExpiredError } = useRecoveryState();
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  console.log('ResetPassword: Recovery state', { isActiveRecovery, hasExpiredError });

  // Se tem erro de expiração ou não está em recovery ativo, mostrar form de reenvio
  if (hasExpiredError || !isActiveRecovery) {
    const handleResendLink = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) {
        setError("Digite seu email para reenviar o link.");
        return;
      }

      setResendLoading(true);
      setError(null);

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`
        });

        if (error) {
          setError(error.message || "Erro ao enviar email. Tente novamente.");
        } else {
          setError(null);
          alert("Novo link enviado para seu email!");
        }
      } catch (error) {
        console.error('Error resending password reset:', error);
        setError("Erro ao enviar email. Tente novamente.");
      } finally {
        setResendLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-lg">
          <h1 className="text-2xl font-semibold mb-2 text-foreground">Link expirado ou inválido</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Seu link de recuperação expirou ou já foi utilizado. Informe seu email para receber um novo link.
          </p>

          <form onSubmit={handleResendLink} className="space-y-4">
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
              required
            />
            {error && <div className="text-destructive text-sm">{error}</div>}
            <button
              type="submit"
              disabled={resendLoading}
              className="w-full rounded bg-primary text-primary-foreground py-2 font-medium disabled:opacity-60 hover:bg-primary/90"
            >
              {resendLoading ? "Enviando..." : "Enviar novo link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/auth/login")}
              className="text-primary text-sm hover:underline"
            >
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recovery ativo - mostrar formulário de nova senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação de senha forte
    const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!STRONG.test(password)) {
      setError("Use no mínimo 8 caracteres com maiúscula, minúscula, número e símbolo.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    console.log('ResetPassword: Attempting password update');
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('ResetPassword: Password update failed:', error);
        setError(error.message || "Falha ao atualizar senha. Solicite um novo link.");
        return;
      }

      console.log('ResetPassword: Password update successful');

      // Limpar flag no BD
      try {
        await supabase.rpc('set_must_change_password', { flag: false });
        console.log('ResetPassword: Password change flag cleared');
      } catch (error) {
        console.error('ResetPassword: Error clearing flag (non-blocking):', error);
      }
      
      // Atualizar sessão e redirecionar
      await supabase.auth.refreshSession();
      navigate("/dashboard", { replace: true });
      
    } catch (error) {
      console.error('ResetPassword: Unexpected error:', error);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold mb-2 text-foreground">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Por segurança, defina sua nova senha antes de continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
            required
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
            required
          />
          {error && <div className="text-destructive text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary text-primary-foreground py-2 font-medium disabled:opacity-60 hover:bg-primary/90"
          >
            {loading ? "Atualizando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;