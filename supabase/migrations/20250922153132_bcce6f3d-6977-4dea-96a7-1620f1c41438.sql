-- RPC seguro para set_must_change_password (evita updates diretos no client)
create or replace function public.set_must_change_password(flag boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set must_change_password = flag,
         updated_at = now()
   where id = auth.uid();
end;
$$;