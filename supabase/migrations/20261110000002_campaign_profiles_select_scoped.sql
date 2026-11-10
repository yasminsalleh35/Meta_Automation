-- audit SEC-02 regression (found in re-verification 2026-11-10).
-- 20261102000001 dropped cp_select_all assuming the policy "Users can view their own auto-generated
-- profiles" existed in production. It does not: only cp_admin_write is live, so non-admin users saw
-- 0 campaign profiles (CampaignProfileSelector on "Meu Negócio" was empty).
-- This is the policy the plan specified (docs/audit-fix-plan.md, SEC-02): shared (non auto-generated)
-- profiles for every logged-in user, auto-generated ones only for their owner, everything for admins.
-- Rollback: drop policy cp_select_scoped on public.campaign_profiles;

drop policy if exists cp_select_scoped on public.campaign_profiles;
create policy cp_select_scoped on public.campaign_profiles
  for select
  to authenticated
  using (
    owner_user_id = auth.uid()
    or coalesce(is_auto_generated, false) = false
    or public.is_admin_or_super_admin()
  );
