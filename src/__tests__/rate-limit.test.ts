import { describe, it, expect } from 'vitest';

// Rate limit logic tests
// Mirrors the in-memory rate limiter in _shared/rateLimit.ts

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  check(key: string, limit: number, windowMs: number, now = Date.now()): {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
  } {
    // Cleanup expired
    for (const [k, v] of this.store.entries()) {
      if (now > v.resetTime) this.store.delete(k);
    }

    let entry = this.store.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      this.store.set(key, entry);
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.resetTime - now,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: limit - entry.count,
      retryAfterMs: 0,
    };
  }

  reset() {
    this.store.clear();
  }
}

describe('Rate Limiter', () => {
  it('should allow requests within limit', () => {
    const limiter = new RateLimiter();
    const now = 1000000;

    for (let i = 0; i < 5; i++) {
      const result = limiter.check('user_1', 5, 60000, now);
      expect(result.allowed).toBe(true);
    }
  });

  it('should block after limit exceeded', () => {
    const limiter = new RateLimiter();
    const now = 1000000;

    // Use up all 3 requests
    for (let i = 0; i < 3; i++) {
      limiter.check('user_2', 3, 60000, now);
    }

    // 4th should be blocked
    const result = limiter.check('user_2', 3, 60000, now);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('should reset after window expires', () => {
    const limiter = new RateLimiter();
    const now = 1000000;
    const windowMs = 60000;

    // Exhaust limit
    for (let i = 0; i < 3; i++) {
      limiter.check('user_3', 3, windowMs, now);
    }
    expect(limiter.check('user_3', 3, windowMs, now).allowed).toBe(false);

    // After window expires
    const later = now + windowMs + 1;
    const result = limiter.check('user_3', 3, windowMs, later);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('should track users independently', () => {
    const limiter = new RateLimiter();
    const now = 1000000;

    // User A uses all 2 requests
    limiter.check('user_a', 2, 60000, now);
    limiter.check('user_a', 2, 60000, now);
    expect(limiter.check('user_a', 2, 60000, now).allowed).toBe(false);

    // User B should still have requests
    expect(limiter.check('user_b', 2, 60000, now).allowed).toBe(true);
  });

  it('should report correct remaining count', () => {
    const limiter = new RateLimiter();
    const now = 1000000;

    const r1 = limiter.check('user_r', 5, 60000, now);
    expect(r1.remaining).toBe(4);

    const r2 = limiter.check('user_r', 5, 60000, now);
    expect(r2.remaining).toBe(3);
  });

  it('should report retry-after when blocked', () => {
    const limiter = new RateLimiter();
    const now = 1000000;
    const windowMs = 30000;

    limiter.check('user_retry', 1, windowMs, now); // use up the 1 request
    const result = limiter.check('user_retry', 1, windowMs, now);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeLessThanOrEqual(windowMs);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
