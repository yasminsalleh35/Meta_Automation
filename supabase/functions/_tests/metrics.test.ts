// audit DATA-02: one definition for conversations, cost per conversation and CPC.
import { assertEquals, assertAlmostEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  CONVERSATION_ACTION_TYPE,
  actionValue,
  countConversations,
  costPerConversation,
  cpc,
  ctr,
  normalizeInsight,
} from '../_shared/metrics.ts';

// Shape Meta returns for a CTWA campaign: the same conversations appear under
// several overlapping action types.
const overlappingActions = [
  { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '12' },
  { action_type: 'onsite_conversion.messaging_conversation_started_1d', value: '10' },
  { action_type: 'onsite_conversion.messaging_first_reply', value: '9' },
  { action_type: 'start_messaging', value: '12' },
  { action_type: 'contact_total', value: '12' },
  { action_type: 'link_click', value: '40' },
];

Deno.test('conversations = messaging_conversation_started_7d only (no summing of overlapping types)', () => {
  assertEquals(CONVERSATION_ACTION_TYPE, 'onsite_conversion.messaging_conversation_started_7d');
  assertEquals(countConversations(overlappingActions), 12);
});

Deno.test('conversations: missing / empty / malformed actions → 0', () => {
  assertEquals(countConversations(undefined), 0);
  assertEquals(countConversations(null), 0);
  assertEquals(countConversations([]), 0);
  assertEquals(countConversations([{ action_type: 'link_click', value: '3' }]), 0);
  assertEquals(countConversations([{ action_type: CONVERSATION_ACTION_TYPE, value: 'abc' }]), 0);
  // deno-lint-ignore no-explicit-any
  assertEquals(countConversations('nope' as any), 0);
});

Deno.test('same action type across several rows/pages is summed', () => {
  const rows = [
    { action_type: CONVERSATION_ACTION_TYPE, value: '3' },
    { action_type: CONVERSATION_ACTION_TYPE, value: 4 },
  ];
  assertEquals(actionValue(rows, CONVERSATION_ACTION_TYPE), 7);
});

Deno.test('costPerConversation = spend / conversations, null when no conversations', () => {
  assertEquals(costPerConversation(120, 12), 10);
  assertEquals(costPerConversation('45.5', '5'), 9.1);
  assertEquals(costPerConversation(100, 0), null);
  assertEquals(costPerConversation(0, 0), null);
  assertEquals(costPerConversation(100, undefined), null);
});

Deno.test('cpc = spend / clicks, null when no clicks (never used as CPA)', () => {
  assertEquals(cpc(100, 40), 2.5);
  assertEquals(cpc('10', '4'), 2.5);
  assertEquals(cpc(100, 0), null);
  assertEquals(cpc(100, null), null);
});

Deno.test('ctr = clicks / impressions * 100', () => {
  assertAlmostEquals(ctr(40, 2000), 2);
  assertEquals(ctr(10, 0), 0);
});

Deno.test('normalizeInsight on a Meta insights row', () => {
  const n = normalizeInsight({
    impressions: '2000',
    reach: '1500',
    clicks: '40',
    spend: '120.00',
    actions: overlappingActions,
  });
  assertEquals(n, {
    impressions: 2000,
    reach: 1500,
    clicks: 40,
    spend: 120,
    conversations: 12,
    costPerConversation: 10,
    cpc: 3,
    ctr: 2,
  });
});

Deno.test('normalizeInsight on an empty row (no delivery in the window)', () => {
  assertEquals(normalizeInsight({}), {
    impressions: 0,
    reach: 0,
    clicks: 0,
    spend: 0,
    conversations: 0,
    costPerConversation: null,
    cpc: null,
    ctr: 0,
  });
  assertEquals(normalizeInsight(undefined).conversations, 0);
});
