// QA-01: exercises the real in-memory limiter in _shared/rateLimit.ts (replaces the vitest file
// that re-implemented it inline).
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { assertRateLimit } from '../_shared/rateLimit.ts';

const req = (origin = 'https://iacamply.com') =>
  new Request('https://edge.test/fn', { method: 'POST', headers: { Origin: origin } });

Deno.test('allows up to `limit` calls, then 429 with Retry-After and scoped CORS', async () => {
  const key = `rl-basic-${crypto.randomUUID()}`;
  for (let i = 0; i < 3; i++) assertEquals(assertRateLimit(req(), { key, limit: 3, window: 60 }), null);
  const blocked = assertRateLimit(req(), { key, limit: 3, window: 60 });
  assert(blocked, '4th call must be blocked');
  assertEquals(blocked!.status, 429);
  const retry = Number(blocked!.headers.get('Retry-After'));
  assert(retry > 0 && retry <= 60, `Retry-After=${retry}`);
  assertEquals(blocked!.headers.get('Access-Control-Allow-Origin'), 'https://iacamply.com');
  assertEquals((await blocked!.json()).error, 'Rate limit exceeded');
});

Deno.test('keys are independent', () => {
  const a = `rl-a-${crypto.randomUUID()}`;
  const b = `rl-b-${crypto.randomUUID()}`;
  assertEquals(assertRateLimit(req(), { key: a, limit: 1, window: 60 }), null);
  assert(assertRateLimit(req(), { key: a, limit: 1, window: 60 }));
  assertEquals(assertRateLimit(req(), { key: b, limit: 1, window: 60 }), null);
});

Deno.test('window expiry resets the counter', () => {
  const key = `rl-expiry-${crypto.randomUUID()}`;
  const realNow = Date.now;
  const t0 = realNow();
  try {
    Date.now = () => t0;
    assertEquals(assertRateLimit(req(), { key, limit: 1, window: 1 }), null);
    assert(assertRateLimit(req(), { key, limit: 1, window: 1 }));
    Date.now = () => t0 + 1_001;
    assertEquals(assertRateLimit(req(), { key, limit: 1, window: 1 }), null);
  } finally {
    Date.now = realNow;
  }
});

Deno.test('a disallowed Origin never gets echoed back on the 429', () => {
  const key = `rl-origin-${crypto.randomUUID()}`;
  assertRateLimit(req('https://evil.example'), { key, limit: 0, window: 60 });
  const blocked = assertRateLimit(req('https://evil.example'), { key, limit: 0, window: 60 });
  assert(blocked);
  assert(blocked!.headers.get('Access-Control-Allow-Origin') !== 'https://evil.example');
});
