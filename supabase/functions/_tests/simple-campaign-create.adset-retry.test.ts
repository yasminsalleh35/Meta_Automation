// Deep E2E for the ad-set self-healing retry (Meta v23 subcode 2490562 — discontinued
// Facebook "video_feeds" placement). Drives the real createAdSetWithInterestRetries against a
// mocked Meta Graph API and asserts it strips deprecated placements and recovers.
// Run: deno test -A supabase/functions/_tests/simple-campaign-create.adset-retry.test.ts
import { assert, assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts';
Deno.env.set('SCC_DISABLE_SERVE', '1');
const { createAdSetWithInterestRetries } = await import('../simple-campaign-create/index.ts');

const noopLogger = () => {};
const testOpts = { sanitizeOps: false, sanitizeResources: false } as const;

interface Call { body: any; }

// Queue of canned responses; each fetch dequeues the next.
function installFetch(responses: Array<{ status: number; json: unknown }>) {
  const calls: Call[] = [];
  let i = 0;
  (globalThis as any).fetch = async (_input: unknown, init?: RequestInit) => {
    calls.push({ body: JSON.parse((init?.body as string) || '{}') });
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return new Response(JSON.stringify(r.json), { status: r.status, headers: { 'content-type': 'application/json' } });
  };
  return calls;
}

const reject2490562 = {
  status: 400,
  json: { error: { code: 100, error_subcode: 2490562, error_user_title: 'Posicionamento descontinuado', error_user_msg: 'O posicionamento de feeds de vídeos do Facebook foi descontinuado para esta versão da API e não pode ser selecionado.' } },
};
const ok = (id: string) => ({ status: 200, json: { id } });

function baseAdSet(facebook_positions: string[]) {
  return {
    name: 'AdSet',
    campaign_id: 'cmp_1',
    daily_budget: '5000',
    optimization_goal: 'CONVERSATIONS',
    destination_type: 'WHATSAPP',
    promoted_object: { page_id: 'page1' },
    targeting: {
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions,
      instagram_positions: ['stream', 'story', 'reels'],
      age_min: 18,
      age_max: 65,
      genders: [0],
    },
  };
}

// A — strips video_feeds and succeeds on retry; the retried body must not contain it.
Deno.test({ ...testOpts, name: 'A 2490562 → strips video_feeds, retries, succeeds' }, async () => {
  const calls = installFetch([reject2490562, ok('as_ok')]);
  const result = await createAdSetWithInterestRetries({
    adAccountId: '123', accessToken: 'tok', adSetPayload: baseAdSet(['feed', 'video_feeds', 'story']), logger: noopLogger,
  });
  assertEquals(result.id, 'as_ok');
  assertEquals(calls.length, 2);
  // First attempt still had it; the retry must have removed it.
  assert(calls[0].body.targeting.facebook_positions.includes('video_feeds'));
  assertEquals(calls[1].body.targeting.facebook_positions, ['feed', 'story']);
});

// B — if video_feeds was the only position, the key is dropped entirely on retry.
Deno.test({ ...testOpts, name: 'B 2490562 → only video_feeds → facebook_positions key removed' }, async () => {
  const calls = installFetch([reject2490562, ok('as_ok2')]);
  const result = await createAdSetWithInterestRetries({
    adAccountId: '123', accessToken: 'tok', adSetPayload: baseAdSet(['video_feeds']), logger: noopLogger,
  });
  assertEquals(result.id, 'as_ok2');
  assertEquals(calls.length, 2);
  assertEquals(calls[1].body.targeting.facebook_positions, undefined);
});

// C — 2490562 but nothing deprecated to strip → does NOT loop forever; fails after one attempt.
Deno.test({ ...testOpts, name: 'C 2490562 with nothing to strip → no infinite loop, throws' }, async () => {
  const calls = installFetch([reject2490562, reject2490562, reject2490562, reject2490562]);
  await assertRejects(() => createAdSetWithInterestRetries({
    adAccountId: '123', accessToken: 'tok', adSetPayload: baseAdSet(['feed', 'story']), logger: noopLogger,
  }));
  assertEquals(calls.length, 1); // broke immediately, no retry storm
});

// D — sanity: first-try success, single call, payload preserved.
Deno.test({ ...testOpts, name: 'D first-try success → single call' }, async () => {
  const calls = installFetch([ok('as_first')]);
  const result = await createAdSetWithInterestRetries({
    adAccountId: '123', accessToken: 'tok', adSetPayload: baseAdSet(['feed', 'story']), logger: noopLogger,
  });
  assertEquals(result.id, 'as_first');
  assertEquals(calls.length, 1);
  assertEquals(calls[0].body.targeting.facebook_positions, ['feed', 'story']);
});
