// supabase/functions/_shared/status.ts
// Vocabulário canônico de campaigns.status (audit CMP-10). Sempre minúsculo
// (ver migration 20260412000000_fix_campaign_status_case.sql).

export type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'finished'
  | 'error'
  | 'deleted';

export const CAMPAIGN_STATUSES: readonly CampaignStatus[] = [
  'draft', 'pending_review', 'active', 'paused', 'finished', 'error', 'deleted',
];

// effective_status da Meta (campaign/adset/ad) → status canônico
const META_EFFECTIVE_TO_CANONICAL: Record<string, CampaignStatus> = {
  ACTIVE: 'active',
  IN_PROCESS: 'pending_review',
  PENDING_REVIEW: 'pending_review',
  PREAPPROVED: 'pending_review',
  PAUSED: 'paused',
  CAMPAIGN_PAUSED: 'paused',
  ADSET_PAUSED: 'paused',
  DISAPPROVED: 'error',
  WITH_ISSUES: 'error',
  PENDING_BILLING_INFO: 'error',
  ARCHIVED: 'finished',
  COMPLETED: 'finished',
  DELETED: 'deleted',
};

// valores legados já gravados no DB (effective_status.toLowerCase() etc.)
const LEGACY_TO_CANONICAL: Record<string, CampaignStatus> = {
  in_review: 'pending_review',
  rejected: 'error',
};

/**
 * Converte um effective_status da Meta (ou um status já salvo, em qualquer caixa)
 * para o vocabulário canônico. Retorna null se desconhecido — o chamador deve
 * então manter o status atual em vez de gravar lixo.
 */
export function mapMetaEffectiveStatus(raw: string | null | undefined): CampaignStatus | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper in META_EFFECTIVE_TO_CANONICAL) return META_EFFECTIVE_TO_CANONICAL[upper];
  const lower = value.toLowerCase();
  if ((CAMPAIGN_STATUSES as readonly string[]).includes(lower)) return lower as CampaignStatus;
  return LEGACY_TO_CANONICAL[lower] ?? null;
}
