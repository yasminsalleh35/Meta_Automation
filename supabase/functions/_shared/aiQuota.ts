// supabase/functions/_shared/aiQuota.ts
// Limite por usuário para IA paga (audit SEC-10): 20/hora e 100/dia por padrão.
import { HttpError } from "./auth.ts";

// Tipo estrutural: as functions usam versões diferentes do supabase-js
type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

export async function consumeAiQuota(db: RpcClient, userId: string, fn: string): Promise<void> {
  const perHour = Number(Deno.env.get("AI_QUOTA_PER_HOUR") ?? 20);
  const perDay = Number(Deno.env.get("AI_QUOTA_PER_DAY") ?? 100);
  const { data, error } = await db.rpc("consume_ai_quota", {
    p_user_id: userId,
    p_function: fn,
    p_per_hour: perHour,
    p_per_day: perDay,
  });
  if (error) {
    // Falha fechada: sem contador confiável, não chamamos o provedor pago
    console.error(`[aiQuota] consume_ai_quota failed: ${error.message}`);
    throw new HttpError(503, "ai_quota_unavailable");
  }
  if (data !== true) throw new HttpError(429, "ai_quota_exceeded");
}
