-- Consolidar colunas de planos (manter apenas test_plan_id_* e live_plan_id_*)
-- Usar CASCADE para dropar dependências (views)
DO $$
BEGIN
  -- Migrar test_plan_mensal_id -> test_plan_id_mensal
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='pagarme_settings' AND column_name='test_plan_mensal_id') THEN
    UPDATE public.pagarme_settings 
    SET test_plan_id_mensal = COALESCE(test_plan_id_mensal, test_plan_mensal_id)
    WHERE test_plan_id_mensal IS NULL;
    
    ALTER TABLE public.pagarme_settings DROP COLUMN IF EXISTS test_plan_mensal_id CASCADE;
  END IF;
  
  -- Migrar test_plan_anual_id -> test_plan_id_anual
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='pagarme_settings' AND column_name='test_plan_anual_id') THEN
    UPDATE public.pagarme_settings 
    SET test_plan_id_anual = COALESCE(test_plan_id_anual, test_plan_anual_id)
    WHERE test_plan_id_anual IS NULL;
    
    ALTER TABLE public.pagarme_settings DROP COLUMN IF EXISTS test_plan_anual_id CASCADE;
  END IF;
  
  -- Migrar live_plan_mensal_id -> live_plan_id_mensal
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='pagarme_settings' AND column_name='live_plan_mensal_id') THEN
    UPDATE public.pagarme_settings 
    SET live_plan_id_mensal = COALESCE(live_plan_id_mensal, live_plan_mensal_id)
    WHERE live_plan_id_mensal IS NULL;
    
    ALTER TABLE public.pagarme_settings DROP COLUMN IF EXISTS live_plan_mensal_id CASCADE;
  END IF;
  
  -- Migrar live_plan_anual_id -> live_plan_id_anual
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema='public' AND table_name='pagarme_settings' AND column_name='live_plan_anual_id') THEN
    UPDATE public.pagarme_settings 
    SET live_plan_id_anual = COALESCE(live_plan_id_anual, live_plan_anual_id)
    WHERE live_plan_id_anual IS NULL;
    
    ALTER TABLE public.pagarme_settings DROP COLUMN IF EXISTS live_plan_anual_id CASCADE;
  END IF;
END $$;