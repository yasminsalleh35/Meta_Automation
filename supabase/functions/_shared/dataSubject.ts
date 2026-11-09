// supabase/functions/_shared/dataSubject.ts
// Direitos do titular (LGPD art. 18) — audit LGL-03.
// Helpers puros usados por user-data-export e user-account-delete (testados em _tests/dataSubject.test.ts).

/** Palavra que o usuário digita para confirmar a exclusão. Mesma constante em src/lib/accountStatus.ts. */
export const DELETE_ACCOUNT_CONFIRMATION_WORD = 'EXCLUIR';

export function isDeleteConfirmation(input: unknown): boolean {
  return typeof input === 'string' && input.trim().toUpperCase() === DELETE_ACCOUNT_CONFIRMATION_WORD;
}

/** Colunas que nunca saem do servidor (tokens/segredos de integração). */
export const SECRET_COLUMNS = ['access_token', 'refresh_token', 'app_secret', 'access_token_preview'];

export interface ExportTable {
  /** tabela em public */
  table: string;
  /** coluna que identifica o titular */
  column: string;
  /** colunas removidas de cada linha (além de SECRET_COLUMNS) */
  omit?: string[];
}

/**
 * Tabelas com dados pessoais do titular (levantadas em produção em 2026-11-09).
 * Ficam de fora: caches/filas operacionais (campaign_metrics_cache, account_insights_cache,
 * campaign_sync_queue, meta_api_usage, rate_limits, oauth_states, edge_function_logs),
 * logs de segurança (security_audit_log, integration_access_log) e quiz_leads (dados de
 * terceiros em quizzes da Camply, não do titular).
 */
export const EXPORT_TABLES: ExportTable[] = [
  { table: 'profiles', column: 'id', omit: ['password_reset_token', 'password_reset_expires', 'failed_login_attempts', 'locked_until'] },
  { table: 'business_settings', column: 'user_id' },
  { table: 'campaigns', column: 'user_id' },
  { table: 'whatsapp_campaigns', column: 'user_id' },
  { table: 'campaign_contingency', column: 'user_id', omit: ['admin_notes', 'error_stack'] },
  { table: 'campaign_profiles', column: 'owner_user_id' },
  { table: 'media_files', column: 'user_id' },
  { table: 'notifications', column: 'user_id' },
  { table: 'support_tickets', column: 'user_id' },
  { table: 'strategy_reports', column: 'user_id' },
  { table: 'optimization_suggestions', column: 'user_id' },
  { table: 'performance_alerts', column: 'user_id' },
  { table: 'integrations', column: 'user_id' },
  { table: 'whatsapp_numbers', column: 'user_id' },
  { table: 'meta_whatsapp_numbers', column: 'user_id' },
  { table: 'subscribers', column: 'user_id' },
  { table: 'subscription_status_log', column: 'user_id' },
  { table: 'payments', column: 'user_id' },
  { table: 'pagarme_customers', column: 'user_id' },
  { table: 'pagarme_subscriptions', column: 'user_id' },
  { table: 'user_entitlements', column: 'user_id' },
  { table: 'usage_tracking', column: 'user_id' },
  { table: 'ai_usage_events', column: 'user_id' },
  { table: 'leads', column: 'user_id' },
  { table: 'user_roles', column: 'user_id' },
  { table: 'user_learning_progress', column: 'user_id' },
  { table: 'learning_content_comments', column: 'user_id' },
];

/** Remove segredos e colunas omitidas de uma linha. */
export function sanitizeRow(row: Record<string, unknown>, omit: string[] = []): Record<string, unknown> {
  const drop = new Set([...SECRET_COLUMNS, ...omit]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row ?? {})) {
    if (!drop.has(k)) out[k] = v;
  }
  return out;
}

/** Nome do arquivo baixado: camply-meus-dados-YYYY-MM-DD.json */
export function exportFileName(now: Date = new Date()): string {
  return `camply-meus-dados-${now.toISOString().slice(0, 10)}.json`;
}

/** Texto da notificação enviada a cada admin quando alguém pede exclusão. */
export function adminDeletionNotice(email: string | null | undefined, userId: string, hardDeleteAt: Date) {
  const who = email ? `${email} (${userId})` : userId;
  return {
    title: 'Exclusão de conta solicitada',
    message:
      `O usuário ${who} pediu a exclusão da conta (LGPD). ` +
      `Cancele manualmente a assinatura/cobrança dele no provedor de pagamento. ` +
      `A conta será apagada definitivamente em ${hardDeleteAt.toISOString().slice(0, 10)}; ` +
      `para cancelar a exclusão, reative o usuário no painel admin.`,
  };
}
