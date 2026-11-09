// audit CMP-10 / QA-01: the canonical campaign-status mapper (imports the real _shared/status.ts).
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { CAMPAIGN_STATUSES, mapMetaEffectiveStatus } from '../_shared/status.ts';

Deno.test('Meta effective_status → canonical status', () => {
  const cases: Array<[string, string]> = [
    ['ACTIVE', 'active'],
    ['IN_PROCESS', 'pending_review'],
    ['PENDING_REVIEW', 'pending_review'],
    ['PREAPPROVED', 'pending_review'],
    ['PAUSED', 'paused'],
    ['CAMPAIGN_PAUSED', 'paused'],
    ['ADSET_PAUSED', 'paused'],
    ['DISAPPROVED', 'error'],
    ['WITH_ISSUES', 'error'],
    ['PENDING_BILLING_INFO', 'error'],
    ['ARCHIVED', 'finished'],
    ['COMPLETED', 'finished'],
    ['DELETED', 'deleted'],
  ];
  for (const [raw, expected] of cases) assertEquals(mapMetaEffectiveStatus(raw), expected, raw);
});

Deno.test('already-canonical values in any case pass through; legacy values map', () => {
  for (const s of CAMPAIGN_STATUSES) {
    assertEquals(mapMetaEffectiveStatus(s), s);
    assertEquals(mapMetaEffectiveStatus(s.toUpperCase()), s);
  }
  assertEquals(mapMetaEffectiveStatus('  active  '), 'active');
  assertEquals(mapMetaEffectiveStatus('in_review'), 'pending_review');
  assertEquals(mapMetaEffectiveStatus('REJECTED'), 'error');
});

Deno.test('unknown / empty → null (caller keeps the current status)', () => {
  for (const raw of [null, undefined, '', '   ', 'SOMETHING_NEW', 'Ativa']) {
    assertEquals(mapMetaEffectiveStatus(raw as string | null | undefined), null, String(raw));
  }
});
