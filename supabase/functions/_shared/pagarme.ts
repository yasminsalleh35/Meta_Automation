// supabase/functions/_shared/pagarme.ts
// Helpers Pagar.me compartilhados (audit PAY-05 / PAY-07 / SEC-10).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { HttpError, isAdminUser } from "./auth.ts";

export type PagarmeEnv = "live" | "test";

export interface PagarmeFunctionConfig {
  secret_key: string;
  [k: string]: unknown;
}

/**
 * get_pagarme_config_for_functions(p_environment) retorna um SET; sem argumento a chamada
 * é ambígua (duas overloads). Sempre passe o ambiente e pegue uma linha.
 */
export async function loadPagarmeConfig(db: SupabaseClient, env?: PagarmeEnv): Promise<PagarmeFunctionConfig> {
  const environment: PagarmeEnv = env ?? ((Deno.env.get("PAGARME_ENV") as PagarmeEnv) || "live");
  const { data, error } = await db.rpc("get_pagarme_config_for_functions", { p_environment: environment });
  const row = Array.isArray(data) ? data[0] : data;
  // Mesma fonte do checkout (pagarme-subscribe): secret do ambiente; a coluna do banco é fallback
  const secretKey = Deno.env.get(`PAGARME_SECRET_KEY_${environment.toUpperCase()}`) || row?.secret_key;
  if (error || !row || !secretKey) {
    throw new HttpError(500, "pagarme_config_not_found", `Pagar.me config not found (${environment})`);
  }
  return { ...row, secret_key: secretKey } as PagarmeFunctionConfig;
}

/** A assinatura Pagar.me precisa pertencer ao usuário (admin pode qualquer uma). */
export async function assertOwnsPagarmeSubscription(
  db: SupabaseClient,
  userId: string,
  subscriptionId: string,
): Promise<void> {
  const { data } = await db
    .from("subscribers")
    .select("user_id")
    .eq("pagarme_subscription_id", String(subscriptionId))
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return;
  if (await isAdminUser(db, userId)) return;
  throw new HttpError(403, "forbidden");
}
