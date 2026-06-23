// Unit tests for the pure helpers in simple-campaign-create + shared utils.
// Run: deno test -A supabase/functions/_tests/simple-campaign-create.helpers.test.ts
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
// Disable the production `serve()` call before importing the module under test.
Deno.env.set('SCC_DISABLE_SERVE', '1');
const {
  toAccountPath,
  extractInvalidInterestIds,
  normalizeSpecialAdCategories,
  safeUrlForLog,
  metaAuthHeaders,
} = await import('../simple-campaign-create/index.ts');
const { sanitizeInterests, mapGenders, clampAge } = await import('../simple-campaign-create/utils.ts');

Deno.test('toAccountPath normalizes any input to a single act_ prefix', () => {
  assertEquals(toAccountPath('123'), 'act_123');
  assertEquals(toAccountPath('act_123'), 'act_123');
  assertEquals(toAccountPath('act_act_123'), 'act_123');
  assertEquals(toAccountPath('ACT_123'), 'act_123');
});

Deno.test('extractInvalidInterestIds parses long numeric ids from error text', () => {
  assertEquals(extractInvalidInterestIds('Invalid data for field interests: 6003123456789, 6003987654321'), ['6003123456789', '6003987654321']);
  assertEquals(extractInvalidInterestIds('no ids here'), []);
  assertEquals(extractInvalidInterestIds(undefined), []);
});

Deno.test('normalizeSpecialAdCategories filters unknowns and defaults to NONE', () => {
  assertEquals(normalizeSpecialAdCategories([]).categories, ['NONE']);
  assertEquals(normalizeSpecialAdCategories('credit').categories, ['CREDIT']);
  assertEquals(normalizeSpecialAdCategories(['bogus']).categories, ['NONE']);
  const iep = normalizeSpecialAdCategories(['ISSUES_ELECTIONS_POLITICS']);
  assertEquals(iep.categories, ['ISSUES_ELECTIONS_POLITICS']);
  assertEquals(iep.country, ['BR']);
});

Deno.test('safeUrlForLog strips the query string (token hygiene)', () => {
  assertEquals(safeUrlForLog('https://graph.facebook.com/v23.0/x?access_token=secret&a=1'), 'https://graph.facebook.com/v23.0/x');
  assertEquals(safeUrlForLog('https://graph.facebook.com/v23.0/x'), 'https://graph.facebook.com/v23.0/x');
});

Deno.test('metaAuthHeaders builds a Bearer header and merges extras', () => {
  assertEquals(metaAuthHeaders('tok'), { Authorization: 'Bearer tok' });
  assertEquals(metaAuthHeaders('tok', { 'Content-Type': 'application/json' }), {
    Authorization: 'Bearer tok',
    'Content-Type': 'application/json',
  });
});

Deno.test('utils.sanitizeInterests keeps valid ids, dedups, drops invalids', () => {
  const out = sanitizeInterests([
    { id: '6003123456', name: 'A' },
    { id: '6003123456', name: 'A dup' }, // dup
    { id: '12', name: 'too short' },     // <5 digits
    { id: 'abc', name: 'non-numeric' },
    { id: '6009999999' },                // no name is allowed
  ]);
  assertEquals(out, [{ id: '6003123456', name: 'A' }, { id: '6009999999' }]);
});

Deno.test('utils.mapGenders maps to Meta gender codes', () => {
  assertEquals(mapGenders('male'), [1]);
  assertEquals(mapGenders('female'), [2]);
  assertEquals(mapGenders('all'), [0]);
  assertEquals(mapGenders(null), [0]);
  assertEquals(mapGenders([1, 2]), [1, 2]);
});

Deno.test('utils.clampAge clamps within bounds and handles bad input', () => {
  assertEquals(clampAge(30, 18, 65), 30);
  assertEquals(clampAge(10, 18, 65), 18);
  assertEquals(clampAge(99, 18, 65), 65);
  assertEquals(clampAge(undefined, 18, 65), 18);
  assert(Number.isFinite(clampAge(NaN, 18, 65)));
});
