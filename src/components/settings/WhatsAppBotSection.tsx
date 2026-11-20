import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, RefreshCw, Unlink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatBotNumber, type useWhatsAppBotLink } from '@/hooks/useWhatsAppBotLink';

// WhatsApp campaign bot: connect this account to the user's WhatsApp (plan §10).

type BotLink = ReturnType<typeof useWhatsAppBotLink>;

function useCountdown(expiresAt: string | null): number {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) { setLeft(0); return; }
    const end = new Date(expiresAt).getTime();
    const tick = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

export const WhatsAppBotSection: React.FC<{ bot: BotLink }> = ({ bot }) => {
  const { toast } = useToast();
  const { status, linkCode, busy, error, start, unlink } = bot;
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const secondsLeft = useCountdown(linkCode?.expiresAt ?? null);
  const expired = !!linkCode && secondsLeft === 0;
  const botNumber = formatBotNumber(status?.botNumber);

  if (!status?.available) return null;

  const handleUnlink = async () => {
    setConfirmUnlink(false);
    if (await unlink()) toast({ title: 'WhatsApp desconectado', description: 'Este número não cria mais campanhas na sua conta.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          Criar campanhas pelo WhatsApp
        </CardTitle>
        <CardDescription>
          Conecte seu WhatsApp e crie campanhas conversando com a Camply: envie a foto ou vídeo (ou o link de um post do
          Instagram), escolha a região e o valor por dia. Toda campanha é criada pausada e só começa a rodar quando você
          toca em <strong>Ativar</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

        {status.linked ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="text-sm">
                <p className="font-medium">Conectado: {status.phoneMasked}</p>
                {status.linkedAt && (
                  <p className="text-muted-foreground">desde {new Date(status.linkedAt).toLocaleDateString('pt-BR')}</p>
                )}
                <p className="mt-2">
                  Envie <strong>oi</strong> para{' '}
                  <a className="underline" href={`https://wa.me/${status.botNumber}`} target="_blank" rel="noopener noreferrer">{botNumber}</a>{' '}
                  para começar.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setConfirmUnlink(true)} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
              Desconectar
            </Button>
          </div>
        ) : linkCode && !expired ? (
          <div className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Toque em <strong>Abrir WhatsApp</strong> no celular com o número que você quer conectar.</li>
              <li>Envie a mensagem que já vem escrita.</li>
            </ol>
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Seu código</p>
              <p className="font-mono text-3xl font-semibold tracking-widest" aria-live="polite">{linkCode.code}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Expira em {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </p>
            </div>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 sm:w-auto">
              <a href={linkCode.waLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir WhatsApp
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Ou envie <strong>VINCULAR {linkCode.code}</strong> para {botNumber}. Esta página atualiza sozinha quando
              o número for conectado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expired && <p className="text-sm text-muted-foreground">O código expirou. Gere um novo.</p>}
            <Button onClick={() => void start()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : expired ? <RefreshCw className="mr-2 h-4 w-4" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              {expired ? 'Gerar novo código' : 'Conectar WhatsApp'}
            </Button>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmUnlink} onOpenChange={setConfirmUnlink}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar o WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              O número {status.phoneMasked} deixará de criar campanhas na sua conta. As campanhas já criadas não mudam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleUnlink()}>Desconectar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
