import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Most requests should fail fast, so keep a 60s ceiling by default. But a few Edge Functions
// legitimately run long: creating a campaign uploads the media to Meta and, for VIDEOS, polls
// Meta until the video finishes processing (up to ~2 min) before it can build the campaign/ad.
// A blanket 60s abort was cutting that off mid-creation — which disconnects the function
// server-side (so nothing is created and no log is written) and then triggered a
// duplicate-creating retry on the client. Give those endpoints a longer budget instead.
const DEFAULT_TIMEOUT_MS = 60_000;
const LONG_TIMEOUT_MS = 180_000;
const LONG_RUNNING_PATHS = ['/simple-campaign-create'];

const urlOf = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return (input as Request).url ?? '';
};

// Custom fetch with a per-endpoint timeout — allows the long-running campaign-create Edge
// Function to complete while keeping everything else on a tight 60s leash.
const customFetch: typeof fetch = (input, init) => {
  const isLongRunning = LONG_RUNNING_PATHS.some((p) => urlOf(input).includes(p));
  const timeoutMs = isLongRunning ? LONG_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Preserve any caller-supplied abort signal instead of silently overriding it.
  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch,
  }
});
