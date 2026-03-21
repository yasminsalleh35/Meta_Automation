import { describe, it, expect } from 'vitest';

// Meta API helper function tests
// Tests WhatsApp link construction, object_story_id format, budget conversion

function buildWhatsAppLink(phoneNumber: string, message?: string): string {
  // Strip non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  const base = `https://wa.me/${cleaned}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

function buildObjectStoryId(instagramUserId: string, mediaId: string): string {
  return `${instagramUserId}_${mediaId}`;
}

function budgetToCents(reais: number): number {
  return Math.round(reais * 100);
}

function centsToBudget(cents: number): number {
  return cents / 100;
}

function formatAdAccountId(id: string): string {
  if (id.startsWith('act_')) return id;
  return `act_${id}`;
}

function stripAdAccountPrefix(id: string): string {
  return id.replace(/^act_/, '');
}

function isValidMetaMediaType(type: string): boolean {
  return ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'].includes(type);
}

function getCreativeStrategy(mediaType: string): 'object_story_id' | 'video_data' | 'photo_data' | 'link_data' {
  if (mediaType === 'VIDEO') return 'video_data';
  if (mediaType === 'IMAGE') return 'photo_data';
  if (mediaType === 'CAROUSEL_ALBUM') return 'object_story_id'; // carousels use existing post
  return 'link_data'; // fallback
}

describe('WhatsApp Link Builder', () => {
  it('should build basic wa.me link', () => {
    expect(buildWhatsAppLink('5511999999999')).toBe('https://wa.me/5511999999999');
  });

  it('should strip non-numeric chars', () => {
    expect(buildWhatsAppLink('+55 (11) 99999-9999')).toBe('https://wa.me/5511999999999');
  });

  it('should add encoded message param', () => {
    const link = buildWhatsAppLink('5511999999999', 'Olá, gostaria de saber mais');
    expect(link).toContain('wa.me/5511999999999');
    expect(link).toContain('?text=');
    expect(link).toContain('Ol%C3%A1');
  });
});

describe('Object Story ID', () => {
  it('should combine IG user ID and media ID', () => {
    expect(buildObjectStoryId('17841400123', '17899506438123456'))
      .toBe('17841400123_17899506438123456');
  });
});

describe('Budget Conversion', () => {
  it('should convert reais to cents', () => {
    expect(budgetToCents(20)).toBe(2000);
    expect(budgetToCents(5.5)).toBe(550);
    expect(budgetToCents(0.01)).toBe(1);
  });

  it('should handle floating point precision', () => {
    // 19.99 * 100 = 1998.9999... in JS, Math.round fixes it
    expect(budgetToCents(19.99)).toBe(1999);
  });

  it('should convert cents back to reais', () => {
    expect(centsToBudget(2000)).toBe(20);
    expect(centsToBudget(550)).toBe(5.5);
  });
});

describe('Ad Account ID', () => {
  it('should add act_ prefix when missing', () => {
    expect(formatAdAccountId('123456789')).toBe('act_123456789');
  });

  it('should not double-prefix', () => {
    expect(formatAdAccountId('act_123456789')).toBe('act_123456789');
  });

  it('should strip prefix', () => {
    expect(stripAdAccountPrefix('act_123456789')).toBe('123456789');
  });

  it('should handle already stripped', () => {
    expect(stripAdAccountPrefix('123456789')).toBe('123456789');
  });
});

describe('Media Type Validation', () => {
  it('should accept valid types', () => {
    expect(isValidMetaMediaType('IMAGE')).toBe(true);
    expect(isValidMetaMediaType('VIDEO')).toBe(true);
    expect(isValidMetaMediaType('CAROUSEL_ALBUM')).toBe(true);
  });

  it('should reject invalid types', () => {
    expect(isValidMetaMediaType('REELS')).toBe(false);
    expect(isValidMetaMediaType('STORY')).toBe(false);
    expect(isValidMetaMediaType('')).toBe(false);
  });
});

describe('Creative Strategy Selection', () => {
  it('should use video_data for VIDEO (Reels)', () => {
    expect(getCreativeStrategy('VIDEO')).toBe('video_data');
  });

  it('should use photo_data for IMAGE', () => {
    expect(getCreativeStrategy('IMAGE')).toBe('photo_data');
  });

  it('should use object_story_id for CAROUSEL_ALBUM', () => {
    expect(getCreativeStrategy('CAROUSEL_ALBUM')).toBe('object_story_id');
  });

  it('should fall back to link_data for unknown types', () => {
    expect(getCreativeStrategy('UNKNOWN')).toBe('link_data');
  });
});
