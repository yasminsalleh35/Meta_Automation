-- audit DATA-07 (re-verification 2026-11-10): the learning area is logged-in only
-- (learning tables were restricted to `authenticated` in 20261109000020). Two leftovers:
--   1. learning_content_comments "Anyone can view comments" — SELECT true for `public`, so the anon
--      key could list every comment with its user_id.
--   2. inc_view_count(uuid) — SECURITY DEFINER, executable by anon (view-count inflation).
-- Rollback: recreate the policy "Anyone can view comments" (for select using (true)) and
-- `grant execute on function public.inc_view_count(uuid) to anon`.

drop policy if exists "Anyone can view comments" on public.learning_content_comments;
drop policy if exists "Authenticated users can view comments" on public.learning_content_comments;
create policy "Authenticated users can view comments"
  on public.learning_content_comments
  for select
  to authenticated
  using (true);

-- the write policies already require auth.uid() = user_id; scope them to `authenticated` explicitly
alter policy "Users can create their own comments" on public.learning_content_comments to authenticated;
alter policy "Users can update their own comments" on public.learning_content_comments to authenticated;
alter policy "Users can delete their own comments" on public.learning_content_comments to authenticated;

revoke execute on function public.inc_view_count(uuid) from public, anon;
grant execute on function public.inc_view_count(uuid) to authenticated, service_role;
