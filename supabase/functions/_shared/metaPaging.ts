// supabase/functions/_shared/metaPaging.ts
// Segue paging.next da Graph API (audit CMP-11). me/accounts devolve 25 por página
// por padrão; sem isso, usuários com muitas páginas/contas viam só a primeira.

export const MAX_GRAPH_PAGES = 10;

export interface GraphPagedResult<T> {
  ok: boolean;
  status: number;
  data: T[];
  /** corpo de erro da página que falhou (se houver) */
  error?: any;
  /** true se parou por atingir maxPages com paging.next ainda presente */
  truncated: boolean;
}

/**
 * Busca `firstUrl` e todas as páginas seguintes (até `maxPages`).
 * `init` é reaplicado em cada página (ex.: header Authorization: Bearer).
 * Em erro numa página, retorna ok=false com os dados coletados até ali.
 */
export async function fetchAllGraphPages<T = any>(
  firstUrl: string,
  init: RequestInit = {},
  opts: { maxPages?: number; timeoutMs?: number } = {},
): Promise<GraphPagedResult<T>> {
  const maxPages = opts.maxPages ?? MAX_GRAPH_PAGES;
  const data: T[] = [];
  let url: string | null = firstUrl;
  let pages = 0;
  let status = 200;

  while (url && pages < maxPages) {
    // timeout por página (um AbortSignal.timeout no init valeria para o loop todo)
    const pageInit: RequestInit = opts.timeoutMs
      ? { ...init, signal: AbortSignal.timeout(opts.timeoutMs) }
      : init;
    const res: Response = await fetch(url, pageInit);
    status = res.status;
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok || json?.error) {
      return { ok: false, status: res.ok ? 400 : res.status, data, error: json?.error ?? json, truncated: false };
    }

    if (Array.isArray(json?.data)) data.push(...json.data);
    pages++;
    url = typeof json?.paging?.next === 'string' ? json.paging.next : null;
  }

  if (url) {
    console.warn(`[metaPaging] Parou após ${maxPages} páginas; restam mais resultados`);
  }
  return { ok: true, status, data, truncated: !!url };
}
