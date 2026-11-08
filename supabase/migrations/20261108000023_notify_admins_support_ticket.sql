-- =============================================
-- Audit ADM-05 (2026-11-08): aviso de ticket de suporte para os admins.
-- useSupportTickets criava a notificação "Novo Ticket de Suporte" para o PRÓPRIO usuário
-- (a policy de INSERT exige auth.uid() = user_id), então nenhum admin era avisado.
-- Esta RPC insere uma notificação por admin/super_admin, somente para um ticket do chamador.
-- =============================================
create or replace function public.notify_admins_new_support_ticket(p_ticket_id uuid)
returns integer
language plpgsql volatile security definer set search_path = public as $$
declare
  v_subject text;
  v_inserted int;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  select t.subject into v_subject
  from public.support_tickets t
  where t.id = p_ticket_id and t.user_id = auth.uid();

  if not found then
    raise exception 'Ticket não encontrado' using errcode = 'P0002';
  end if;

  insert into public.notifications (user_id, title, message, type, read)
  select distinct ur.user_id,
         'Novo Ticket de Suporte',
         'Novo ticket criado: ' || left(coalesce(v_subject, ''), 200),
         'info',
         false
  from public.user_roles ur
  where ur.role in ('admin', 'super_admin');
  get diagnostics v_inserted = row_count;

  return v_inserted;
end $$;
revoke all on function public.notify_admins_new_support_ticket(uuid) from public, anon;
grant execute on function public.notify_admins_new_support_ticket(uuid) to authenticated, service_role;
