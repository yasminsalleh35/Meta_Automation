-- WhatsApp bot: session lock with an owner token (review fix, 2026-11-20).
-- Before: release cleared the lock no matter who held it, and a long run could outlive its lock.
-- Now: each run claims with its own token, extends the lock while it works, and can only release
-- (or extend) a lock it still owns. Callers: supabase/functions/_shared/waBot/runtime.ts.

alter table public.wa_bot_sessions add column if not exists lock_token uuid;

drop function if exists public.wa_bot_claim_session(text, int);
drop function if exists public.wa_bot_release_session(uuid);

-- Creates the session row if missing and takes the lock for p_token.
-- Returns the session id when acquired, NULL when another run holds it.
create or replace function public.wa_bot_claim_session(p_wa_id text, p_token uuid, p_lock_seconds int default 180)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if p_token is null then raise exception 'p_token required'; end if;
  insert into public.wa_bot_sessions (wa_id) values (p_wa_id) on conflict (wa_id) do nothing;
  update public.wa_bot_sessions
     set locked_until = now() + make_interval(secs => greatest(10, least(p_lock_seconds, 600))),
         lock_token = p_token
   where wa_id = p_wa_id and (locked_until is null or locked_until < now())
  returning id into v_id;
  return v_id;
end;
$$;

-- Extends the lock only while p_token still owns it. Returns false when the lock was lost.
create or replace function public.wa_bot_extend_session(p_id uuid, p_token uuid, p_lock_seconds int default 180)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wa_bot_sessions
     set locked_until = now() + make_interval(secs => greatest(10, least(p_lock_seconds, 600)))
   where id = p_id and lock_token = p_token;
  return found;
end;
$$;

-- Releases the lock only if p_token still owns it.
create or replace function public.wa_bot_release_session(p_id uuid, p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$ update public.wa_bot_sessions set locked_until = null, lock_token = null where id = p_id and lock_token = p_token; $$;

revoke all on function public.wa_bot_claim_session(text, uuid, int) from public, anon, authenticated;
revoke all on function public.wa_bot_extend_session(uuid, uuid, int) from public, anon, authenticated;
revoke all on function public.wa_bot_release_session(uuid, uuid) from public, anon, authenticated;
grant execute on function public.wa_bot_claim_session(text, uuid, int) to service_role;
grant execute on function public.wa_bot_extend_session(uuid, uuid, int) to service_role;
grant execute on function public.wa_bot_release_session(uuid, uuid) to service_role;
