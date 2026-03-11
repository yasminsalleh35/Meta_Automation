-- FASE 3: Adicionar novos status na tabela campaign_contingency

-- Adicionar coluna para armazenar estratégia usada no retry
ALTER TABLE campaign_contingency
ADD COLUMN IF NOT EXISTS retry_strategy text;

COMMENT ON COLUMN campaign_contingency.retry_strategy IS 
'Estratégia usada na tentativa automática: ctwa, walink, null';

COMMENT ON COLUMN campaign_contingency.status IS 
'Status da contingência: 
- pending: aguardando processamento (tentará auto-retry wa.me)
- auto_retry_success: criada automaticamente via wa.me link
- auto_retry_failed: falha no auto-retry, necessita criação manual
- in_progress: admin está processando manualmente
- completed: finalizada manualmente pelo admin
- failed: falha definitiva';

-- Adicionar índice para buscar contingências por status (otimização)
CREATE INDEX IF NOT EXISTS idx_campaign_contingency_status 
ON campaign_contingency(status) 
WHERE status IN ('pending', 'auto_retry_failed', 'auto_retry_success');