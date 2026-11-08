// Contrato de erro do simple-campaign-create (audit CMP-01).
// 422 = falha determinística (o usuário precisa corrigir algo; nada fica criado na Meta).
// 202 = falha transitória da Meta (rollback feito; contingência aberta para o time).

export type CampaignErrorCode =
  | 'UNAUTHENTICATED'
  | 'ACCOUNT_SUSPENDED'
  | 'INVALID_PAYLOAD'
  | 'NO_INTEGRATION'
  | 'PAGE_NOT_ALLOWED'
  | 'PAGE_NO_WHATSAPP'
  | 'INVALID_WHATSAPP'
  | 'IG_MEDIA_MISSING'
  | 'NO_LOCATION'
  | 'META_PERMISSION'
  | 'META_FUNDS'
  | 'META_INVALID_PARAM'
  | 'META_TRANSIENT'
  | 'INTERNAL';

export class CampaignError extends Error {
  constructor(
    public code: CampaignErrorCode,
    public userMessage: string,
    public metaError?: { code?: number; subcode?: number; message?: string; fbtrace_id?: string },
  ) {
    super(`${code}: ${metaError?.message || userMessage}`);
  }

  get transient(): boolean {
    return this.code === 'META_TRANSIENT' || this.code === 'INTERNAL';
  }

  get httpStatus(): number {
    if (this.code === 'UNAUTHENTICATED') return 401;
    if (this.code === 'ACCOUNT_SUSPENDED') return 403; // audit ADM-02
    return this.transient ? 202 : 422;
  }
}

// Códigos Graph tratados como temporários: erro desconhecido/serviço, limites de taxa.
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 613, 80000, 80004]);
const PERMISSION_CODES = new Set([10, 102, 190, 200, 294]);

/** Converte uma resposta de erro da Graph API num CampaignError com mensagem pt-BR. */
export function classifyMetaError(status: number, body: any, stage: string): CampaignError {
  const e = body?.error ?? {};
  const meta = { code: e.code, subcode: e.error_subcode, message: e.message, fbtrace_id: e.fbtrace_id };
  const text = `${e.message ?? ''} ${e.error_user_title ?? ''} ${e.error_user_msg ?? ''}`;

  if (status >= 500 || status === 429 || TRANSIENT_CODES.has(e.code) || e.is_transient === true) {
    return new CampaignError('META_TRANSIENT',
      'A Meta está instável no momento. Recebemos seu pedido e nossa equipe vai concluir a criação da campanha.', meta);
  }
  if (PERMISSION_CODES.has(e.code) || (e.code >= 200 && e.code < 300)) {
    return new CampaignError('META_PERMISSION',
      'Sua conexão com a Meta expirou ou não tem permissão para esta conta de anúncios. Reconecte a Meta em Integrações e tente de novo.', meta);
  }
  if (/payment|funding|billing|pagamento|cobran|saldo|spend(ing)? limit|limite de gastos/i.test(text)) {
    return new CampaignError('META_FUNDS',
      'A conta de anúncios está sem forma de pagamento válida ou atingiu o limite de gastos. Ajuste no Gerenciador de Anúncios e tente de novo.', meta);
  }
  const userMsg = e.error_user_msg || e.error_user_title;
  return new CampaignError('META_INVALID_PARAM',
    userMsg ? `A Meta recusou a campanha (${stage}): ${userMsg}` : `A Meta recusou a campanha (${stage}). Revise os dados e tente de novo.`,
    meta);
}

/** Qualquer erro → CampaignError. Erros não classificados viram INTERNAL (vão para a fila do time). */
export function toCampaignError(err: unknown): CampaignError {
  if (err instanceof CampaignError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  if (/rate limit|timed out|timeout|network|fetch failed|connection/i.test(msg)) {
    return new CampaignError('META_TRANSIENT',
      'A Meta está instável no momento. Recebemos seu pedido e nossa equipe vai concluir a criação da campanha.',
      { message: msg });
  }
  return new CampaignError('INTERNAL',
    'Não conseguimos concluir a criação agora. Recebemos seu pedido e nossa equipe vai finalizar a campanha.',
    { message: msg });
}
