// audit LGL-03: helpers de exportação/exclusão de conta.
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  DELETE_ACCOUNT_CONFIRMATION_WORD as edgeWord,
  isDeleteConfirmation as edgeConfirm,
  sanitizeRow,
  EXPORT_TABLES,
  exportFileName,
  adminDeletionNotice,
} from '../_shared/dataSubject.ts';
import {
  DELETE_ACCOUNT_CONFIRMATION_WORD as webWord,
  isDeleteConfirmation as webConfirm,
} from '../../../src/lib/accountStatus.ts';

Deno.test('confirmation word: edge and frontend copies agree', () => {
  assertEquals(edgeWord, webWord);
  for (const input of ['EXCLUIR', ' excluir ', 'Excluir', '', 'EXCLUI', null, undefined, 42]) {
    assertEquals(edgeConfirm(input), webConfirm(input), String(input));
  }
  assert(edgeConfirm('excluir'));
  assert(!edgeConfirm('delete'));
});

Deno.test('sanitizeRow drops tokens and omitted columns', () => {
  const row = { id: '1', access_token: 'a', refresh_token: 'r', app_secret: 's', access_token_preview: 'p', status: 'active', note: 'x' };
  assertEquals(sanitizeRow(row, ['note']), { id: '1', status: 'active' });
  assertEquals(sanitizeRow(null as any), {});
});

Deno.test('EXPORT_TABLES: unique tables, profiles by id, integrations included', () => {
  const names = EXPORT_TABLES.map((t) => t.table);
  assertEquals(new Set(names).size, names.length);
  assertEquals(EXPORT_TABLES.find((t) => t.table === 'profiles')?.column, 'id');
  assert(names.includes('integrations'));
  assert(!names.includes('ticket_responses')); // exportado à parte, pelos tickets do usuário
});

Deno.test('exportFileName and admin notice', () => {
  assertEquals(exportFileName(new Date('2026-11-09T12:00:00Z')), 'camply-meus-dados-2026-11-09.json');
  const n = adminDeletionNotice('a@b.com', 'uid-1', new Date('2026-12-09T00:00:00Z'));
  assert(n.message.includes('a@b.com (uid-1)'));
  assert(n.message.includes('2026-12-09'));
  assert(n.message.toLowerCase().includes('assinatura'));
});
