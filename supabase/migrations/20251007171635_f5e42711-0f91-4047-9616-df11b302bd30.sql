-- Copy existing plan IDs from pagarme_settings to pagarme_config (if they exist)
-- This ensures the live plans created are now accessible by the checkout

-- Update live environment plan IDs
UPDATE public.pagarme_config
SET 
  plan_id_mensal = 'plan_NRn7Qz4TMuKZ6VXp',
  plan_id_anual = 'plan_wBJ4KGqTzOHy4aGp',
  updated_at = now()
WHERE environment = 'live';

-- Log the update
COMMENT ON TABLE public.pagarme_config IS 'Pagar.me configuration table - unified source of truth for all environments';
