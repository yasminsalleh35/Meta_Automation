// supabase/functions/_shared/cors.ts
const DEFAULT_ALLOWED = [
  "https://iacamply.com",
  "https://camplyia.netlify.app",
];

const ORIGINS_FROM_ENV =
  Deno.env.get("ALLOWED_ORIGINS")?.split(",").map((s) => s.trim()).filter(Boolean) || [];

export const ALLOWED_ORIGINS = [...new Set([...ORIGINS_FROM_ENV, ...DEFAULT_ALLOWED])];

function isLocalDev(origin: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function corsHeadersFor(originHeader: string | null) {
  const allowOrigin =
    originHeader && (ALLOWED_ORIGINS.includes(originHeader) || isLocalDev(originHeader))
      ? originHeader
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  } as Record<string, string>;
}

export function handlePreflight(req: Request) {
  const headers = corsHeadersFor(req.headers.get("Origin"));
  if (req.headers.get("Access-Control-Request-Method")) {
    return new Response(null, { status: 204, headers });
  }
  return new Response("ok", { status: 200, headers });
}

export function jsonWithCors(origin: string | null, body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers || {});
  const cors = corsHeadersFor(origin);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}