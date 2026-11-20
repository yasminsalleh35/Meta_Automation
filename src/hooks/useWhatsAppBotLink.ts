import { useCallback, useEffect, useRef, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// WhatsApp campaign bot — link this account to a WhatsApp number (docs/whatsapp-campaign-bot-plan.md §10).
// All reads/writes go through the wa-bot-link edge function; the browser never touches the wa_bot_* tables.

export interface WaBotStatus {
  available: boolean;
  linked: boolean;
  phoneMasked: string | null;
  linkedAt: string | null;
  pending: { expiresAt: string } | null;
  botNumber: string | null;
}

export interface WaBotLinkCode {
  code: string;
  waLink: string;
  expiresAt: string;
}

const POLL_MS = 3000;

async function errorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error === 'already_linked') return 'Esta conta já tem um WhatsApp conectado.';
      if (body?.error === 'not_available') return 'A criação de campanhas pelo WhatsApp ainda não está disponível para sua conta.';
      return body?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/** "5533984135052" → "+55 33 98413-5052" */
export function formatBotNumber(digits: string | null | undefined): string {
  const d = String(digits ?? '').replace(/\D/g, '');
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : d ? `+${d}` : '';
}

export function useWhatsAppBotLink() {
  const [status, setStatus] = useState<WaBotStatus | null>(null);
  const [linkCode, setLinkCode] = useState<WaBotLinkCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const call = useCallback(async <T,>(action: 'status' | 'start' | 'unlink'): Promise<T> => {
    const { data, error: fnError } = await supabase.functions.invoke('wa-bot-link', { body: { action } });
    if (fnError) throw fnError;
    return data as T;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await call<WaBotStatus>('status');
      if (!mounted.current) return;
      setStatus(s);
      setError(null);
      if (s.linked) setLinkCode(null);
    } catch (e) {
      if (mounted.current) setError(await errorMessage(e, 'Não foi possível carregar o status do WhatsApp.'));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [call]);

  const start = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      const c = await call<WaBotLinkCode>('start');
      if (!mounted.current) return false;
      setLinkCode(c);
      setError(null);
      return true;
    } catch (e) {
      if (mounted.current) setError(await errorMessage(e, 'Não foi possível gerar o código. Tente novamente.'));
      return false;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [call]);

  const unlink = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      await call<{ ok: boolean }>('unlink');
      setLinkCode(null);
      await refresh();
      return true;
    } catch (e) {
      if (mounted.current) setError(await errorMessage(e, 'Não foi possível desconectar. Tente novamente.'));
      return false;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [call, refresh]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; };
  }, [refresh]);

  // While a code is on screen, poll until the user sends it from WhatsApp (or it expires).
  useEffect(() => {
    if (!linkCode || status?.linked) return;
    const expires = new Date(linkCode.expiresAt).getTime();
    const id = setInterval(() => {
      if (Date.now() > expires) { clearInterval(id); return; }
      void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [linkCode, status?.linked, refresh]);

  return { status, linkCode, loading, busy, error, refresh, start, unlink };
}
