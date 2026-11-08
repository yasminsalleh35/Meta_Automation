// Audit ADM-03: termos de busca interpolados em filtros PostgREST `.or(...)` permitiam injetar
// condições extras (vírgula/parênteses) e curingas (`%`, `*`). Remova esses caracteres antes.

const MAX_SEARCH_LENGTH = 100;

/** Remove caracteres com significado na sintaxe PostgREST/ILIKE. Retorna '' se nada sobrar. */
export function sanitizeSearchTerm(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw)
    .replace(/[,()%*\\"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}

/**
 * Monta um filtro `.or()` de ILIKE seguro para várias colunas.
 * Retorna null quando o termo é vazio após a limpeza (não aplicar filtro).
 */
export function buildIlikeOrFilter(columns: string[], raw: string | null | undefined): string | null {
  const term = sanitizeSearchTerm(raw);
  if (!term) return null;
  return columns.map((col) => `${col}.ilike.%${term}%`).join(',');
}

/** Tamanho de página padrão das listas do admin (PostgREST limita respostas a 1.000 linhas). */
export const ADMIN_PAGE_SIZE = 50;

/** Intervalo [from, to] inclusivo para `.range()` a partir de uma página 0-based. */
export function pageRange(page: number, pageSize: number = ADMIN_PAGE_SIZE): [number, number] {
  const size = Math.min(Math.max(1, Math.floor(pageSize) || ADMIN_PAGE_SIZE), 1000);
  const p = Math.max(0, Math.floor(page) || 0);
  return [p * size, p * size + size - 1];
}
