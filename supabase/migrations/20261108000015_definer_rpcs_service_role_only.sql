-- =============================================
-- Audit DATA-07 (2026-11-08): RPCs SECURITY DEFINER sem uso no cliente → só service_role
-- * IDOR (user_uuid arbitrário): check_user_limit, get_user_subscription_with_plan,
--   increment_usage. Nenhum código (src/ ou functions) chama; SEC-02 já revogou em produção,
--   aqui só reafirma (idempotente, protege replay).
-- * Templates de campanha: create/update/delete_campaign_template não checavam papel
--   (qualquer anon/authenticated alterava/apagava templates globais). Sem chamadas no código.
-- * log_security_audit: permitia a qualquer cliente gravar no log de auditoria. Sem chamadas.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.check_user_limit(text, uuid)',
    'public.get_user_subscription_with_plan(uuid)',
    'public.increment_usage(text, integer, uuid)',
    'public.create_campaign_template(uuid, text, text, text, text, numeric, numeric, text[], text[], text[], text[], boolean)',
    'public.update_campaign_template(uuid, text, text, text, text, numeric, numeric, text[], text[], text[], text[], boolean)',
    'public.delete_campaign_template(uuid)',
    'public.log_security_audit(text, text, uuid, jsonb, jsonb)'
  ]
  loop
    if to_regprocedure(fn) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    end if;
  end loop;
end $$;
