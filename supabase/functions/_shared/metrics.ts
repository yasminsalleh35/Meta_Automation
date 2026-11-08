// audit DATA-02: single definition of the campaign metrics shown across the app
// (dashboard, insights page, monitoring, AI evaluation).
//
// - conversations       = `onsite_conversion.messaging_conversation_started_7d` ONLY.
//                         Meta reports the same conversation under several
//                         overlapping action types (`_1d`, `messaging_first_reply`,
//                         `start_messaging`, ...); summing them double-counts.
// - costPerConversation = spend / conversations (null when there are no conversations)
// - cpc                 = spend / clicks (null when there are no clicks). This is NOT a CPA.
//
// The frontend does not re-derive these from raw `actions`; it reads the values
// computed here (via the edge functions / caches). Tests: _tests/metrics.test.ts.

export const CONVERSATION_ACTION_TYPE = 'onsite_conversion.messaging_conversation_started_7d';

export interface MetaAction {
  action_type?: string;
  value?: string | number;
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

/** Sum of `value` for one action type (summed across rows/pages, never across types). */
export function actionValue(actions: MetaAction[] | null | undefined, actionType: string): number {
  if (!Array.isArray(actions)) return 0;
  let total = 0;
  for (const a of actions) {
    if (a && a.action_type === actionType) total += toNumber(a.value);
  }
  return total;
}

/** Conversations started (CTWA) — the only conversation definition used in Camply. */
export function countConversations(actions: MetaAction[] | null | undefined): number {
  return actionValue(actions, CONVERSATION_ACTION_TYPE);
}

/** spend / conversations, or null when there are no conversations. */
export function costPerConversation(spend: unknown, conversations: unknown): number | null {
  const c = toNumber(conversations);
  if (c <= 0) return null;
  return toNumber(spend) / c;
}

/** spend / clicks, or null when there are no clicks. */
export function cpc(spend: unknown, clicks: unknown): number | null {
  const k = toNumber(clicks);
  if (k <= 0) return null;
  return toNumber(spend) / k;
}

/** clicks / impressions * 100, or 0 when there are no impressions. */
export function ctr(clicks: unknown, impressions: unknown): number {
  const i = toNumber(impressions);
  if (i <= 0) return 0;
  return (toNumber(clicks) / i) * 100;
}

export interface NormalizedInsightMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversations: number;
  costPerConversation: number | null;
  cpc: number | null;
  ctr: number;
}

/** Normalise one Meta insights row (string numbers) into Camply's metric set. */
export function normalizeInsight(raw: any): NormalizedInsightMetrics {
  const r = raw || {};
  const impressions = toNumber(r.impressions);
  const clicks = toNumber(r.clicks);
  const spend = toNumber(r.spend);
  const conversations = countConversations(r.actions);
  return {
    impressions,
    reach: toNumber(r.reach),
    clicks,
    spend,
    conversations,
    costPerConversation: costPerConversation(spend, conversations),
    cpc: cpc(spend, clicks),
    ctr: ctr(clicks, impressions),
  };
}
