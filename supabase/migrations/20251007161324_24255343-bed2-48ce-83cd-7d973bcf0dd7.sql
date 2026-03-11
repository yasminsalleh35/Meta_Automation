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

-- Passo 2: Atualizar registro de TESTE com chaves corretas
UPDATE pagarme_config 
SET 
  secret_key = 'sk_test_add2e8beeeb04cec8fcbce0a7fa60887',
  account_id = 'acc_EJngL2vSZt7L2DQo',
  public_key = 'pk_test_JO5mr2XczCa14eGK',
  webhook_secret = 'hookset_0zrZ5VCN0UwKay7P',
  updated_at = NOW()
WHERE environment = 'test';

-- Passo 3: Inserir/Atualizar registro de PRODUÇÃO com chaves corretas
INSERT INTO pagarme_config (
  environment, 
  secret_key, 
  account_id, 
  public_key, 
  webhook_secret,
  installments_max,
  free_installments,
  interest_rate,
  created_at, 
  updated_at
) VALUES (
  'live',
  'sk_994f84b5eb1f4d8cbaa9d479eb9cb318',
  'acc_1kdov0cjbSgnN7zq',
  'pk_GZOyeqH3Ku2OyY91',
  'hookset_krENbzLfe9uqNG2M',
  12,
  0,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (environment) 
DO UPDATE SET 
  secret_key = EXCLUDED.secret_key,
  account_id = EXCLUDED.account_id,
  public_key = EXCLUDED.public_key,
  webhook_secret = EXCLUDED.webhook_secret,
  updated_at = NOW();