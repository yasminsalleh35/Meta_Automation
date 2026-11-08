import { describe, it, expect } from 'vitest';
import { normalizeBrPhone, waLinkFromPhone } from '@/lib/phone';

describe('normalizeBrPhone', () => {
  it.each([
    ['(11) 91234-5678', '5511912345678'],
    ['21987654321', '5521987654321'],
    ['5521987654321', '5521987654321'],
    ['+55 (33) 3333-3333', '553333333333'],
    ['https://wa.me/5511999999999', '5511999999999'],
    ['https://api.whatsapp.com/send?phone=5511999999999', '5511999999999'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeBrPhone(input)).toBe(expected);
  });

  it.each(['123', '', '4411912345678', '551199'])('rejects %s', (input) => {
    expect(normalizeBrPhone(input)).toBeNull();
  });

  it('builds the wa.me link from the normalised number', () => {
    expect(waLinkFromPhone('(11) 91234-5678')).toBe('https://wa.me/5511912345678');
    expect(waLinkFromPhone('123')).toBeNull();
  });
});
