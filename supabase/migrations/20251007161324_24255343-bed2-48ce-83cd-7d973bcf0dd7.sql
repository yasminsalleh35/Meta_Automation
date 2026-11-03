-- =============================================
-- Correção Pagar.me: Constraint UNIQUE + Atualização de Chaves
-- =============================================

-- Passo 1: Adicionar constraint UNIQUE no environment (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pagarme_config_environment_unique'
  ) THEN
    ALTER TABLE pagarme_config
    ADD CONSTRAINT pagarme_config_environment_unique
    UNIQUE (environment);
  END IF;
END $$;

-- Passos 2 e 3 (removidos — audit SEC-03, 2026-11-02):
-- Esta migração gravava chaves secretas Pagar.me (teste e produção) em texto puro.
-- As chaves foram retiradas do repositório e DEVEM ser rotacionadas no painel Pagar.me.
-- As chaves são configuradas pelo painel admin (pagarme_config), nunca por migração.
-- Mantido como no-op para que um replay não sobrescreva as chaves reais.
