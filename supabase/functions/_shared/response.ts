// Phase 7.1 — Unified response helpers combining CORS + structured format
// Use these instead of raw `new Response()` in edge functions

import { corsHeadersFor } from './cors.ts';
import { buildErrorBody } from './errors.ts';

function makeHeaders(origin: string | null, extra?: Record<string, string>): Headers {
  const h = new Headers();
  const cors = corsHeadersFor(origin);
  for (const [k, v] of Object.entries(cors)) h.set(k, v);
  h.set('Content-Type', 'application/json; charset=utf-8');
  if (extra) {
    for (const [k, v] of Object.entries(extra)) h.set(k, v);
  }
  return h;
}

/** Success response with CORS */
export function ok(origin: string | null, data: unknown, status = 200) {
  return new Response(
    JSON.stringify({ success: true, data }),
    { status, headers: makeHeaders(origin) }
  );
}

/** Error response with CORS + structured body */
export function fail(origin: string | null, err: unknown, statusOverride?: number) {
  const { body, status } = buildErrorBody(err);
  return new Response(
    JSON.stringify(body),
    { status: statusOverride ?? status, headers: makeHeaders(origin) }
  );
}

/** Raw JSON response with CORS (for backward compat — sends body as-is) */
export function json(origin: string | null, body: unknown, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: makeHeaders(origin) }
  );
}

/** CORS preflight handler */
export function preflight(req: Request) {
  const headers = corsHeadersFor(req.headers.get('Origin'));
  return new Response(null, { status: 204, headers });
}
