// supabase/functions/user-data-export/index.ts
// "Exportar meus dados" (LGPD art. 18 II/V) — audit LGL-03.
// Devolve um JSON com as linhas do usuário logado em cada tabela de dados pessoais.
// Usa o service client, mas TODA consulta é filtrada pelo id do usuário autenticado.
// Tokens/segredos de integração nunca entram no arquivo (sanitizeRow).
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { requireUser, authErrorResponse } from '../_shared/auth.ts';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';
import { EXPORT_TABLES, sanitizeRow, exportFileName } from '../_shared/dataSubject.ts';

const PAGE_SIZE = 1000;
const MAX_ROWS_PER_TABLE = 50000;

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const { user, db } = await requireUser(req);

    async function fetchAll(table: string, column: string, value: string | string[]) {
      const rows: Record<string, unknown>[] = [];
      for (let from = 0; from < MAX_ROWS_PER_TABLE; from += PAGE_SIZE) {
        let q = db.from(table).select('*');
        q = Array.isArray(value) ? q.in(column, value) : q.eq(column, value);
        const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        rows.push(...((data ?? []) as Record<string, unknown>[]));
        if (!data || data.length < PAGE_SIZE) break;
      }
      return rows;
    }

    const data: Record<string, unknown[]> = {};
    const errors: Record<string, string> = {};

    for (const spec of EXPORT_TABLES) {
      try {
        const rows = await fetchAll(spec.table, spec.column, user.id);
        data[spec.table] = rows.map((r) => sanitizeRow(r, spec.omit));
      } catch (e) {
        console.error('[user-data-export] table failed', spec.table, (e as Error)?.message);
        errors[spec.table] = 'Não foi possível exportar esta tabela';
      }
    }

    // respostas dos tickets do usuário (inclui as do suporte, exceto notas internas)
    try {
      const ticketIds = ((data.support_tickets ?? []) as Array<{ id: string }>).map((t) => t.id);
      const responses = ticketIds.length ? await fetchAll('ticket_responses', 'ticket_id', ticketIds) : [];
      data.ticket_responses = responses
        .filter((r) => r.is_internal !== true)
        .map((r) => sanitizeRow(r));
    } catch (e) {
      console.error('[user-data-export] ticket_responses failed', (e as Error)?.message);
      errors.ticket_responses = 'Não foi possível exportar esta tabela';
    }

    const body = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        user_metadata: user.user_metadata ?? {},
      },
      data,
      ...(Object.keys(errors).length ? { errors } : {}),
    };

    return new Response(JSON.stringify(body, null, 2), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFileName()}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    const authResp = authErrorResponse(e, cors);
    if (authResp) return authResp;
    console.error('[user-data-export] error', (e as Error)?.message);
    return new Response(JSON.stringify({ success: false, error: 'Não foi possível exportar seus dados. Tente novamente.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
