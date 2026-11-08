-- =============================================
-- Audit DATA-05 (2026-11-08): jsonb gravado como string JSON
-- save-campaign fazia JSON.stringify() antes de gravar em colunas jsonb, gerando
-- escalares jsonb do tipo 'string' ("[...]") em vez de arrays/objetos.
-- O código foi corrigido; aqui convertemos os valores existentes.
-- Produção em 2026-11-08: 0 linhas afetadas (no-op), mantido para replay/staging.
-- Texto que não é JSON válido é mantido como está (não aborta a migração).
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

do $$
declare
  col text;
  r record;
  parsed jsonb;
  fixed int;
  skipped int;
begin
  foreach col in array array['interests','placements','devices','location_selected_locations',
                             'error_log','selected_locations','meta_data','metrics',
                             'daily_insights','ad_schedule']
  loop
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = 'campaigns'
                     and column_name = col and data_type = 'jsonb') then
      continue;
    end if;

    fixed := 0; skipped := 0;
    for r in execute format(
      'select id, %1$I #>> ''{}'' as txt from public.campaigns where jsonb_typeof(%1$I) = ''string''', col)
    loop
      begin
        parsed := r.txt::jsonb;
      exception when others then
        skipped := skipped + 1;
        continue;
      end;
      -- só desfaz o "stringify" quando o texto era um array/objeto JSON
      if jsonb_typeof(parsed) in ('array','object') then
        execute format('update public.campaigns set %I = $1 where id = $2', col) using parsed, r.id;
        fixed := fixed + 1;
      else
        skipped := skipped + 1;
      end if;
    end loop;

    if fixed > 0 or skipped > 0 then
      raise notice 'audit DATA-05: campaigns.% -> % convertidas, % mantidas', col, fixed, skipped;
    end if;
  end loop;
end $$;
