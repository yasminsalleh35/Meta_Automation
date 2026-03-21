import { describe, it, expect } from 'vitest';

// Subscription lifecycle state machine tests
// Mirrors the logic in subscription-sync edge function

type SubStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused' | 'incomplete';

interface Subscription {
  status: SubStatus;
  grace_period_end: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

function canAccessPlatform(sub: Subscription, now: Date): boolean {
  const { status, grace_period_end } = sub;

  // Active, trialing = always allowed
  if (status === 'active' || status === 'trialing') return true;

  // Past due = allowed during grace period
  if (status === 'past_due' && grace_period_end) {
    return now <= new Date(grace_period_end);
  }

  // Canceled = allowed until current period ends
  if (status === 'canceled' && sub.cancel_at_period_end) {
    return now <= new Date(sub.current_period_end);
  }

  // Paused, incomplete, or expired = no access
  return false;
}

function getNextStatus(current: SubStatus, event: string): SubStatus {
  const transitions: Record<string, Record<string, SubStatus>> = {
    active: {
      payment_failed: 'past_due',
      cancel_requested: 'canceled',
      pause_requested: 'paused',
    },
    trialing: {
      trial_ended_with_payment: 'active',
      trial_ended_no_payment: 'past_due',
      cancel_requested: 'canceled',
    },
    past_due: {
      payment_succeeded: 'active',
      grace_expired: 'canceled',
      cancel_requested: 'canceled',
    },
    paused: {
      resume_requested: 'active',
      cancel_requested: 'canceled',
    },
    canceled: {
      resubscribe: 'active',
    },
    incomplete: {
      payment_succeeded: 'active',
      expired: 'canceled',
    },
  };

  return transitions[current]?.[event] || current;
}

describe('Subscription Access Control', () => {
  const now = new Date('2026-03-21T12:00:00Z');

  it('should allow active subscriptions', () => {
    const sub: Subscription = {
      status: 'active',
      grace_period_end: null,
      current_period_end: '2026-04-21',
      cancel_at_period_end: false,
    };
    expect(canAccessPlatform(sub, now)).toBe(true);
  });

  it('should allow trialing subscriptions', () => {
    const sub: Subscription = {
      status: 'trialing',
      grace_period_end: null,
      current_period_end: '2026-04-01',
      cancel_at_period_end: false,
    };
    expect(canAccessPlatform(sub, now)).toBe(true);
  });

  it('should allow past_due within grace period', () => {
    const sub: Subscription = {
      status: 'past_due',
      grace_period_end: '2026-03-26T00:00:00Z', // 5 days from now
      current_period_end: '2026-03-21',
      cancel_at_period_end: false,
    };
    expect(canAccessPlatform(sub, now)).toBe(true);
  });

  it('should deny past_due after grace period', () => {
    const sub: Subscription = {
      status: 'past_due',
      grace_period_end: '2026-03-20T00:00:00Z', // yesterday
      current_period_end: '2026-03-21',
      cancel_at_period_end: false,
    };
    expect(canAccessPlatform(sub, now)).toBe(false);
  });

  it('should allow canceled with period remaining', () => {
    const sub: Subscription = {
      status: 'canceled',
      grace_period_end: null,
      current_period_end: '2026-04-21',
      cancel_at_period_end: true,
    };
    expect(canAccessPlatform(sub, now)).toBe(true);
  });

  it('should deny canceled after period ends', () => {
    const sub: Subscription = {
      status: 'canceled',
      grace_period_end: null,
      current_period_end: '2026-03-20',
      cancel_at_period_end: true,
    };
    expect(canAccessPlatform(sub, now)).toBe(false);
  });

  it('should deny paused subscriptions', () => {
    const sub: Subscription = {
      status: 'paused',
      grace_period_end: null,
      current_period_end: '2026-04-21',
      cancel_at_period_end: false,
    };
    expect(canAccessPlatform(sub, now)).toBe(false);
  });

  it('should deny incomplete subscriptions', () => {
    const sub: Subscription = {
      status: 'incomplete',
      grace_period_end: null,
      current_period_end: '2026-04-21',
      cancel_at_period_end: false,
    };
    expect(canAccessPlatform(sub, now)).toBe(false);
  });
});

describe('Subscription State Machine', () => {
  it('should transition active → past_due on payment failure', () => {
    expect(getNextStatus('active', 'payment_failed')).toBe('past_due');
  });

  it('should transition active → canceled on cancel request', () => {
    expect(getNextStatus('active', 'cancel_requested')).toBe('canceled');
  });

  it('should transition past_due → active on payment success', () => {
    expect(getNextStatus('past_due', 'payment_succeeded')).toBe('active');
  });

  it('should transition past_due → canceled on grace expired', () => {
    expect(getNextStatus('past_due', 'grace_expired')).toBe('canceled');
  });

  it('should transition trialing → active on trial end with payment', () => {
    expect(getNextStatus('trialing', 'trial_ended_with_payment')).toBe('active');
  });

  it('should transition trialing → past_due on trial end without payment', () => {
    expect(getNextStatus('trialing', 'trial_ended_no_payment')).toBe('past_due');
  });

  it('should transition paused → active on resume', () => {
    expect(getNextStatus('paused', 'resume_requested')).toBe('active');
  });

  it('should transition canceled → active on resubscribe', () => {
    expect(getNextStatus('canceled', 'resubscribe')).toBe('active');
  });

  it('should stay in current state on unknown event', () => {
    expect(getNextStatus('active', 'unknown_event')).toBe('active');
  });

  it('should transition incomplete → active on payment', () => {
    expect(getNextStatus('incomplete', 'payment_succeeded')).toBe('active');
  });
});
