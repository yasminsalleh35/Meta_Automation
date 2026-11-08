// Garante que as duas cópias de normalizeBrPhone (edge e frontend) se comportam igual (audit CMP-06).
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { normalizeBrPhone as edge } from '../_shared/phone.ts';
import { normalizeBrPhone as web } from '../../../src/lib/phone.ts';

const cases: Array<[string, string | null]> = [
  ['(11) 91234-5678', '5511912345678'],
  ['21987654321', '5521987654321'],
  ['5521987654321', '5521987654321'],
  ['+55 (33) 3333-3333', '553333333333'],
  ['https://wa.me/5511999999999', '5511999999999'],
  ['123', null],
  ['4411912345678', null],
];

Deno.test('normalizeBrPhone: edge and frontend copies agree', () => {
  for (const [input, expected] of cases) {
    assertEquals(edge(input), expected, `edge ${input}`);
    assertEquals(web(input), expected, `web ${input}`);
  }
});
