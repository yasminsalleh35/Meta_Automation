-- Audit SEC-11 follow-up (2026-11-03): meta-campaign-auto-sync leva > 60s; pg_net marcava timeout
-- embora a function terminasse. Sobe para o limite de wall-clock das edge functions (150s).
create or replace function public.invoke_cron_function(p_function text, p_body jsonb default '{}'::jsonb)
returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare v_url text; v_secret text; v_id bigint;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'project_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if v_url is null or v_secret is null then
    raise exception 'vault secrets project_url/cron_secret not configured';
  end if;
  select net.http_post(
    url := v_url || '/functions/v1/' || p_function,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body := p_body,
    timeout_milliseconds := 150000
  ) into v_id;
  return v_id;
end $$;
revoke all on function public.invoke_cron_function(text, jsonb) from public, anon, authenticated;
