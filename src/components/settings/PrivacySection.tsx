import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DELETE_ACCOUNT_CONFIRMATION_WORD, isDeleteConfirmation } from '@/lib/accountStatus';

// audit LGL-03: direitos do titular (LGPD art. 18) — exportar dados e excluir a conta.

async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.message || body?.error || fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export const PrivacySection: React.FC = () => {
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-data-export', { method: 'POST' });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camply-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Exportação concluída', description: 'O arquivo com seus dados foi baixado.' });
    } catch (error) {
      console.error('Error exporting user data:', error);
      toast({
        title: 'Erro',
        description: await functionErrorMessage(error, 'Não foi possível exportar seus dados. Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleteConfirmation(confirmation)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('user-account-delete', {
        body: { confirmation: confirmation.trim() },
      });
      if (error) throw error;
      setDialogOpen(false);
      toast({
        title: 'Exclusão solicitada',
        description: 'Sua conta será excluída definitivamente em 30 dias. Para cancelar, fale com o suporte.',
      });
      try {
        await logout();
      } catch (e) {
        // a sessão já foi encerrada no servidor; o estado local é limpo mesmo assim
        console.warn('Logout after account deletion:', e);
      }
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast({
        title: 'Erro',
        description: await functionErrorMessage(error, 'Não foi possível solicitar a exclusão da conta. Tente novamente.'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Exportar meus dados
          </CardTitle>
          <CardDescription>
            Baixe um arquivo JSON com os dados pessoais que a Camply guarda sobre você (perfil, negócio,
            campanhas, mídias, notificações, suporte, assinatura e integrações — sem tokens de acesso).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando arquivo...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar meus dados
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir minha conta
          </CardTitle>
          <CardDescription>
            Sua conta é desativada na hora: as campanhas ativas são pausadas e a conexão com a Meta é revogada.
            Depois de 30 dias, a conta e os dados pessoais são apagados definitivamente. Registros fiscais de
            pagamento são mantidos pelo prazo legal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => { setConfirmation(''); setDialogOpen(true); }}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={(open) => { if (!deleting) setDialogOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado e não poderá mais entrar. Para cancelar a exclusão, fale com o suporte em até
              30 dias. Se você tem uma assinatura, nossa equipe cancelará a cobrança.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              Digite <strong>{DELETE_ACCOUNT_CONFIRMATION_WORD}</strong> para confirmar
            </Label>
            <Input
              id="delete-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
              disabled={deleting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || !isDeleteConfirmation(confirmation)}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir conta'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
