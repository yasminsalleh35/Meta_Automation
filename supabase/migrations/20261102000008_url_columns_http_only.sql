-- =============================================
-- Audit SEC-16 (2026-11-02): URLs armazenadas só http(s)
-- leads aceita INSERT anônimo ("Secure lead creation"), então um website javascript:
-- vira XSS no painel admin. NOT VALID: não bloqueia por linhas antigas, mas vale para
-- todo INSERT/UPDATE novo. Depois de limpar as antigas: ALTER TABLE ... VALIDATE CONSTRAINT.
-- =============================================
do $$
begin
  if to_regclass('public.leads') is not null
     and exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'leads' and column_name = 'website')
     and not exists (select 1 from pg_constraint where conname = 'leads_website_http_only') then
    alter table public.leads
      add constraint leads_website_http_only
      check (website is null or website = '' or website ~* '^https?://') not valid;
  end if;
end $$;

-- Limpeza sugerida (rodar manualmente após revisar):
-- update public.leads set website = null where website is not null and website !~* '^https?://';
-- alter table public.leads validate constraint leads_website_http_only;
