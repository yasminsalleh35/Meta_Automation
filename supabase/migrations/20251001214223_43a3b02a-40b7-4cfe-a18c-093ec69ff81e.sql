-- Criar view pública enxuta para config Pagar.me
create or replace view public.pagarme_public_settings_v as
select
  active_environment,
  case when active_environment = 'test' then test_public_key else live_public_key end  as public_key,
  case when active_environment = 'test' then test_encryption_key else live_encryption_key end as encryption_key,
  case when active_environment = 'test' then test_plan_mensal_id else live_plan_mensal_id end as plan_id_mensal,
  case when active_environment = 'test' then test_plan_anual_id else live_plan_anual_id end   as plan_id_anual
from public.pagarme_settings
order by created_at desc
limit 1;

-- Habilitar RLS na view
alter view public.pagarme_public_settings_v set (security_invoker = false);

-- Policy para leitura pública (somente SELECT)
create policy pagarme_public_settings_v_select_public
on public.pagarme_settings
for select
to public
using (true);