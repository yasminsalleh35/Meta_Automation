-- Marcar campanhas órfãs como finished (campanhas com meta_campaign_id mas sem ad_account_id)
-- Isso remove campanhas de integrações antigas que não pertencem à conta ativa
UPDATE public.campaigns
SET 
  status = 'finished',
  updated_at = now()
WHERE meta_campaign_id IS NOT NULL 
  AND ad_account_id IS NULL
  AND status != 'finished';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.campaigns.ad_account_id IS 'Meta Ads Ad Account ID - Required to associate campaign with active integration. NULL values indicate orphaned campaigns from old integrations.';