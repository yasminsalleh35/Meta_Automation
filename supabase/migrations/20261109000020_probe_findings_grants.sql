-- =============================================
-- Audit QA-03 (2026-11-09): achados do security probe (anon key em produção)
-- 1. RPCs que o anon ainda podia executar (todas checam admin/auth.uid() por dentro,
--    mas o anon não deve ter o grant). As usadas pelo app logado ficam com authenticated;
--    as sem nenhum chamador ficam só com service_role.
-- 2. learning_categories / learning_contents eram legíveis sem login; a página de
--    tutoriais é privada, então leitura passa a exigir usuário autenticado.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

-- 1a. usadas pelo app (admin ou usuário logado)
revoke execute on function public.add_lead_comment_admin_safe(uuid, text)                    from public, anon;
revoke execute on function public.update_lead_admin_safe(uuid, text, text, text[], uuid)      from public, anon;
revoke execute on function public.get_integrations_admin_safe()                               from public, anon;
revoke execute on function public.get_leads_admin_safe()                                      from public, anon;
revoke execute on function public.get_pagarme_config_safe()                                   from public, anon;
revoke execute on function public.get_profiles_admin_safe()                                   from public, anon;
revoke execute on function public.get_profiles_admin_with_email()                             from public, anon;
revoke execute on function public.get_stripe_config_safe()                                    from public, anon;
revoke execute on function public.set_must_change_password(boolean)                           from public, anon;

grant execute on function public.add_lead_comment_admin_safe(uuid, text)                      to authenticated;
grant execute on function public.update_lead_admin_safe(uuid, text, text, text[], uuid)        to authenticated;
grant execute on function public.get_integrations_admin_safe()                                 to authenticated;
grant execute on function public.get_leads_admin_safe()                                        to authenticated;
grant execute on function public.get_pagarme_config_safe()                                     to authenticated;
grant execute on function public.get_profiles_admin_safe()                                     to authenticated;
grant execute on function public.get_profiles_admin_with_email()                               to authenticated;
grant execute on function public.get_stripe_config_safe()                                      to authenticated;
grant execute on function public.set_must_change_password(boolean)                             to authenticated;

-- 1b. sem chamador no app / functions: só service_role
revoke execute on function public.check_rate_limit(text, integer, integer)  from public, anon, authenticated;
revoke execute on function public.get_ad_set_settings_admin_safe()          from public, anon, authenticated;
revoke execute on function public.get_ai_configurations_admin_safe()        from public, anon, authenticated;
revoke execute on function public.get_campaign_templates()                  from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer)   to service_role;
grant execute on function public.get_ad_set_settings_admin_safe()           to service_role;
grant execute on function public.get_ai_configurations_admin_safe()         to service_role;
grant execute on function public.get_campaign_templates()                   to service_role;

-- 2. conteúdo de aprendizado só para usuários logados
drop policy if exists "Learning categories are viewable by everyone" on public.learning_categories;
drop policy if exists "learning_categories_authenticated_select" on public.learning_categories;
create policy "learning_categories_authenticated_select" on public.learning_categories
  for select to authenticated using (true);

drop policy if exists "Users can view published content, admins can view all" on public.learning_contents;
drop policy if exists "learning_contents_authenticated_select" on public.learning_contents;
create policy "learning_contents_authenticated_select" on public.learning_contents
  for select to authenticated using ((is_published = true) or public.is_admin_user());
