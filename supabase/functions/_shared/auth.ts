// supabase/functions/_shared/auth.ts
// Guards de autenticação/autorização para edge functions (audit SEC-10).
// IMPORTANTE: verify_jwt=true NÃO é proteção — a anon key é um JWT válido.
import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function bearer(req: Request): string {
  return (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

export function timingSafeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** Usuário logado. A anon key não tem usuário, então getUser() a rejeita. */
export async function requireUser(req: Request): Promise<{ user: User; db: SupabaseClient }> {
  const jwt = bearer(req);
  if (!jwt) throw new HttpError(401, "missing_token");
  const db = serviceClient();
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data?.user) throw new HttpError(401, "invalid_token");
  return { user: data.user, db };
}

export async function isAdminUser(db: SupabaseClient, userId: string): Promise<boolean> {
  // sem .single(): um usuário pode ter mais de um papel
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId);
  return !!data?.some((r: { role: string }) => r.role === "admin" || r.role === "super_admin");
}

export async function requireAdmin(req: Request) {
  const ctx = await requireUser(req);
  if (!(await isAdminUser(ctx.db, ctx.user.id))) throw new HttpError(403, "forbidden");
  return ctx;
}

/** Chamada interna entre functions: Authorization: Bearer <service role key>. */
export function isServiceRole(req: Request): boolean {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const jwt = bearer(req);
  return !!key && !!jwt && timingSafeEqual(key, jwt);
}

export function requireServiceRole(req: Request): void {
  if (!isServiceRole(req)) throw new HttpError(403, "forbidden");
}

/** Service role OU admin logado. */
export async function requireServiceOrAdmin(req: Request): Promise<void> {
  if (isServiceRole(req)) return;
  await requireAdmin(req);
}

/** Cron (pg_cron/pg_net) com header x-cron-secret, ou service role. */
export function isCron(req: Request): boolean {
  const want = Deno.env.get("CRON_SECRET");
  const got = req.headers.get("x-cron-secret");
  return (!!want && !!got && timingSafeEqual(want, got)) || isServiceRole(req);
}

export function requireCron(req: Request): void {
  if (!isCron(req)) throw new HttpError(401, "forbidden");
}

/** Converte HttpError em Response JSON (demais erros: null, para o handler tratar). */
export function authErrorResponse(e: unknown, headers: Record<string, string>): Response | null {
  if (e instanceof HttpError) {
    return new Response(JSON.stringify({ success: false, error: e.code, code: e.code }), {
      status: e.status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  return null;
}
