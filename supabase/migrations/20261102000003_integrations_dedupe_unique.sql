-- =============================================
-- Audit SEC-14 (2026-11-02): uma integração por (user_id, provider)
-- Reconexões criavam linhas duplicadas; várias leituras usam .single() e quebravam.
-- Mantém a linha mais recente (updated_at, depois created_at) e remove as demais.
-- =============================================
begin;

with ranked as (
  select id,
         row_number() over (
           partition by user_id, provider
           order by updated_at desc nulls last, created_at desc nulls last, id
         ) as rn
  from public.integrations
  where user_id is not null
)
delete from public.integrations i
using ranked r
where i.id = r.id and r.rn > 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'integrations_user_provider_unique') then
    alter table public.integrations
      add constraint integrations_user_provider_unique unique (user_id, provider);
  end if;
end $$;

commit;
