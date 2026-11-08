-- =============================================
-- Audit DATA-07 (2026-11-08): handle_new_user não confia mais em raw_user_meta_data
-- raw_user_meta_data vem do cliente no signUp ({ options: { data } }), então
-- email_verified era falsificável. Agora deriva de auth.users.email_confirmed_at
-- (preenchido só pelo GoTrue). Demais comportamentos idênticos à definição de produção.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Insert into profiles
  insert into public.profiles (id, email, name, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email_confirmed_at is not null  -- audit DATA-07: não usar raw_user_meta_data
  );

  -- Give default user role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$function$;
