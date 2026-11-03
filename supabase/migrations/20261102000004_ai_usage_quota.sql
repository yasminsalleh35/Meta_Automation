-- =============================================
-- Audit SEC-10 (2026-11-02): limite por usuário nas functions de IA paga
-- _shared/rateLimit.ts é em memória por isolate (não limita de fato).
-- consume_ai_quota é atômica e só service_role executa.
-- =============================================
begin;

create table if not exists public.ai_usage_events (
  id bigserial primary key,
  user_id uuid not null,
  function_name text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_events_user_time_idx on public.ai_usage_events (user_id, created_at desc);
alter table public.ai_usage_events enable row level security;
-- sem políticas: apenas service_role acessa

create or replace function public.consume_ai_quota(
  p_user_id uuid, p_function text, p_per_hour int default 20, p_per_day int default 100)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_hour int; v_day int;
begin
  -- serializa por usuário para evitar corrida entre requisições paralelas
  perform pg_advisory_xact_lock(hashtext('ai_quota:' || p_user_id::text));
  select count(*) filter (where created_at > now() - interval '1 hour'),
         count(*)
    into v_hour, v_day
    from public.ai_usage_events
   where user_id = p_user_id and created_at > now() - interval '1 day';
  if v_hour >= p_per_hour or v_day >= p_per_day then
    return false;
  end if;
  insert into public.ai_usage_events (user_id, function_name) values (p_user_id, p_function);
  return true;
end $$;
revoke all on function public.consume_ai_quota(uuid, text, int, int) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, text, int, int) to service_role;

commit;
