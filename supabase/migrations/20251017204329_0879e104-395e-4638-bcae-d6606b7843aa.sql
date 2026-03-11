-- 1️⃣ Limpar campanhas órfãs (sem ad_account_id)
DELETE FROM public.campaigns 
WHERE ad_account_id IS NULL;

-- 2️⃣ Melhorar trigger de limpeza para lidar com NULL → valor
DROP TRIGGER IF EXISTS trigger_clean_campaigns_on_ad_account_change ON public.integrations;
DROP FUNCTION IF EXISTS public.clean_old_campaigns_on_integration_change();

CREATE OR REPLACE FUNCTION public.clean_old_campaigns_on_integration_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se o ad_account_id mudou (incluindo NULL → valor ou valor → valor)
  IF (OLD.ad_account_id IS DISTINCT FROM NEW.ad_account_id) 
     AND NEW.ad_account_id IS NOT NULL THEN
    
    -- Apagar campanhas antigas (tanto as do ad_account_id antigo quanto as órfãs)
    DELETE FROM public.campaigns
    WHERE user_id = NEW.user_id
      AND (
        ad_account_id = OLD.ad_account_id 
        OR ad_account_id IS NULL
      );
    
    RAISE NOTICE 'Campanhas antigas removidas: user_id=%, old_ad_account=%, new_ad_account=%', 
                 NEW.user_id, OLD.ad_account_id, NEW.ad_account_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_clean_campaigns_on_ad_account_change
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.clean_old_campaigns_on_integration_change();