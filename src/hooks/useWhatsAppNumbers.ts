import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppNumber {
  business_id: string;
  waba_id: string;
  phone_number_id: string;
  display_phone_number?: string | null;
  verified_name?: string | null;
}

interface PhoneNode { id: string; display_phone_number?: string; verified_name?: string }
interface WabaNode { id: string; name?: string; phone_numbers?: PhoneNode[] }
interface BusinessNode { id: string; name?: string; wabas?: WabaNode[] }

/**
 * Loads the WhatsApp Business numbers available to the connected Meta account, flattened to a
 * simple list, via the same `meta-whatsapp-assets` edge function the integration screen uses.
 * Used by the campaign wizard (step 2) so the user can pick which number a campaign will use.
 */
export const useWhatsAppNumbers = () => {
  const query = useQuery({
    queryKey: ['whatsapp-numbers'],
    queryFn: async (): Promise<WhatsAppNumber[]> => {
      // Always resolve a fresh session first. getSession() auto-refreshes an expired token, and
      // passing the Authorization header explicitly guarantees the invoke uses THAT token rather
      // than a stale one cached on the functions client — this is what made the WhatsApp list
      // silently fail to load when the user lingered on step 1. See useSessionKeepAlive.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      const { data, error } = await supabase.functions.invoke('meta-whatsapp-assets', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw new Error(error.message || 'Falha ao carregar números de WhatsApp');

      const businesses: BusinessNode[] = data?.businesses || [];
      const flat: WhatsAppNumber[] = [];
      for (const b of businesses) {
        for (const w of b.wabas || []) {
          for (const p of w.phone_numbers || []) {
            flat.push({
              business_id: b.id,
              waba_id: w.id,
              phone_number_id: p.id,
              display_phone_number: p.display_phone_number ?? null,
              verified_name: p.verified_name ?? null,
            });
          }
        }
      }
      // de-dup by phone_number_id
      const seen = new Set<string>();
      return flat.filter((n) => (seen.has(n.phone_number_id) ? false : (seen.add(n.phone_number_id), true)));
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    // Recover automatically when the user comes back to the tab or re-enters step 2 after a
    // long time on step 1.
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    numbers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
};
