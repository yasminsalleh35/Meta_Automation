// Normalização única de telefone BR (audit CMP-06). Mantenha igual a supabase/functions/_shared/phone.ts.
// 10/11 dígitos → prefixa 55; 12/13 dígitos começando com 55 → mantém; resto → inválido.
export function normalizeBrPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let raw = String(input);
  // aceita links wa.me / api.whatsapp.com
  const link = raw.match(/(?:wa\.me\/|phone=)(\+?[\d\s().-]+)/i);
  if (link) raw = link[1];
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits;
  return null;
}

export function waLinkFromPhone(input: string | null | undefined): string | null {
  const n = normalizeBrPhone(input);
  return n ? `https://wa.me/${n}` : null;
}
