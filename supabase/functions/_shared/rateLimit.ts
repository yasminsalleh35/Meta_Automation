// Rate limiting middleware for Edge Functions
export interface RateLimitOptions {
  key: string;
  limit: number;
  window: number; // seconds
}

// Simple in-memory rate limiting (per runtime instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const assertRateLimit = (req: Request, options: RateLimitOptions): Response | null => {
  const { key, limit, window } = options;
  const now = Date.now();
  const windowMs = window * 1000;
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (now > v.resetTime) {
      rateLimitStore.delete(k);
    }
  }
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(key, entry);
  }
  
  // Check if limit exceeded
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }
  
  // Increment count
  entry.count++;
  return null;
};