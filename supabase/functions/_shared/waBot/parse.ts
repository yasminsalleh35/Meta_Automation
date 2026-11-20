// Deterministic parsers for the WhatsApp bot (plan §7.2). No AI is used to interpret answers.

/** lowercase, no accents, single spaces, trimmed */
export function norm(text: string | null | undefined): string {
  return String(text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

export type Command = 'menu' | 'cancelar' | 'ajuda' | 'parar' | 'voltar';

const COMMANDS: Record<string, Command> = {
  menu: 'menu', inicio: 'menu', 'menu principal': 'menu',
  cancelar: 'cancelar', cancela: 'cancelar', 'cancelar campanha': 'cancelar',
  ajuda: 'ajuda', help: 'ajuda',
  parar: 'parar', pare: 'parar', stop: 'parar', sair: 'parar',
  voltar: 'voltar', 'quero voltar': 'voltar',
};

/** Only an exact (normalized, punctuation-stripped) command word counts — "cancelar" inside a sentence doesn't. */
export function parseCommand(text: string | null | undefined): Command | null {
  const t = norm(text).replace(/[.!?]+$/g, '').trim();
  return COMMANDS[t] ?? null;
}

/** "VINCULAR 1234 5678" / "vincular 12345678" / "Vincular 1234-5678" → "12345678" */
export function parseLinkCode(text: string | null | undefined): string | null {
  const m = norm(text).match(/^vincular\s*:?\s*(\d{4})[\s-]?(\d{4})$/);
  return m ? m[1] + m[2] : null;
}

/** True when the message looks like a link attempt (to rate-limit wrong codes). */
export function looksLikeLinkAttempt(text: string | null | undefined): boolean {
  return /^vincular\b/.test(norm(text));
}

/**
 * Brazilian money → number (2 decimals). Accepts "50", "R$ 50", "R$50,00", "50 reais", "1.000", "1.000,50", "70.5".
 * Rejects anything with other words or more than one number.
 */
export function parseMoneyBRL(text: string | null | undefined): number | null {
  let t = norm(text).replace(/^r\$\s*/, '').replace(/\s*(reais|real|r\$)\s*$/, '').replace(/\s*(por dia|\/dia|ao dia)$/, '').trim();
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(t)) return null;
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');      // 1.000,50
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');       // 1.000
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** "15", "15km", "15 km", "15 quilometros" → 15 (integer km) */
export function parseKm(text: string | null | undefined): number | null {
  const m = norm(text).match(/^(\d{1,3})(?:[.,]\d+)?\s*(km|kms|quilometros?|kilometros?)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}

export function parseYesNo(text: string | null | undefined): 'yes' | 'no' | null {
  const t = norm(text).replace(/[.!]+$/g, '');
  if (/^(sim|s|ok|confirmar|confirmo|pode|pode sim|ativar|ativa|isso|claro)$/.test(t)) return 'yes';
  if (/^(nao|n|deixar pausada|depois|agora nao)$/.test(t)) return 'no';
  return null;
}

/** "sem data", "7", "7 dias", "30 dias" → 0 | 7 | 30 (0 = no end date) */
export function parseDuration(text: string | null | undefined): 0 | 7 | 30 | null {
  const t = norm(text);
  if (/^(sem (data|data fim|data de termino|fim)|continua|continuo|sem prazo)$/.test(t)) return 0;
  const m = t.match(/^(7|30)( dias)?$/);
  return m ? (Number(m[1]) as 7 | 30) : null;
}

export type InstagramLink = { kind: 'post'; shortcode: string } | { kind: 'story' } | null;

/** instagram.com/p/<code>, /reel/<code>, /reels/<code>, /tv/<code> (optionally /<user>/p/<code>), any query string. */
export function parseInstagramLink(text: string | null | undefined): InstagramLink {
  const s = String(text ?? '');
  if (/instagram\.com\/stories\//i.test(s)) return { kind: 'story' };
  const m = s.match(/(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]{5,64})/i);
  return m ? { kind: 'post', shortcode: m[1] } : null;
}

/** Today's date in São Paulo as YYYY-MM-DD (Brazil has had no DST since 2019 → fixed -03:00). */
export function ymdSaoPaulo(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** End of the last day, same format as the web wizard's toEndIso(): "YYYY-MM-DDT23:59:59-03:00". */
export function endDateIso(now: Date, days: 0 | 7 | 30): string | null {
  if (!days) return null;
  const end = new Date(now.getTime() + days * 86_400_000);
  return `${ymdSaoPaulo(end)}T23:59:59-03:00`;
}

/** dd/MM in São Paulo */
export function ddmm(d: Date): string {
  const [, m, day] = ymdSaoPaulo(d).split('-');
  return `${day}/${m}`;
}

export function brl(n: number): string {
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Campaign name: "<business> – <place> – dd/MM (WhatsApp)", max 100 chars. */
export function buildCampaignName(businessName: string | null | undefined, place: string, now: Date): string {
  const biz = (businessName ?? '').trim() || 'Campanha';
  return `${biz} – ${place} – ${ddmm(now)} (WhatsApp)`.slice(0, 100);
}

/** Splits user-typed ad copy: first line = title (if there are 2+ lines and it's ≤ 40 chars), rest = text. */
export function splitUserCopy(text: string): { title: string | null; text: string } {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n').map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);
  if (nonEmpty.length >= 2 && nonEmpty[0].length <= 40) {
    return { title: nonEmpty[0], text: nonEmpty.slice(1).join('\n') };
  }
  return { title: null, text: nonEmpty.join('\n') };
}
