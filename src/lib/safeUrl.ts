// Bloqueia javascript:, data:, vbscript: etc. em links vindos de dados (audit SEC-16).
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** Retorna a URL se o protocolo for seguro; caso contrário, '#'. */
export function safeUrl(input: string | null | undefined): string {
  if (!input) return '#';
  const value = String(input).trim();
  try {
    const url = new URL(value, window.location.origin);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : '#';
  } catch {
    return '#';
  }
}

export function isSafeUrl(input: string | null | undefined): boolean {
  return safeUrl(input) !== '#';
}

/** Escapa texto para inserção em HTML (ex.: popups do Mapbox com setHTML). */
export function escapeHtml(input: unknown): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
