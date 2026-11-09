// audit LGL-03: status de conta que bloqueiam o login + confirmação da exclusão.
import { describe, it, expect } from 'vitest';
import {
  accountBlockMessage,
  isAccountBlockMessage,
  isDeleteConfirmation,
  ACCOUNT_SUSPENDED_MESSAGE,
  ACCOUNT_PENDING_DELETION_MESSAGE,
} from '@/lib/accountStatus';

describe('accountBlockMessage', () => {
  it('blocks suspended and pending_deletion accounts', () => {
    expect(accountBlockMessage('suspended')).toBe(ACCOUNT_SUSPENDED_MESSAGE);
    expect(accountBlockMessage('pending_deletion')).toBe(ACCOUNT_PENDING_DELETION_MESSAGE);
    expect(ACCOUNT_PENDING_DELETION_MESSAGE).toBe(
      'Sua conta está em processo de exclusão. Para cancelar, fale com o suporte em até 30 dias.',
    );
  });

  it('lets other statuses in', () => {
    expect(accountBlockMessage('active')).toBeNull();
    expect(accountBlockMessage(null)).toBeNull();
    expect(accountBlockMessage(undefined)).toBeNull();
  });

  it('recognises block messages', () => {
    expect(isAccountBlockMessage(ACCOUNT_SUSPENDED_MESSAGE)).toBe(true);
    expect(isAccountBlockMessage(ACCOUNT_PENDING_DELETION_MESSAGE)).toBe(true);
    expect(isAccountBlockMessage('Invalid login credentials')).toBe(false);
  });
});

describe('isDeleteConfirmation', () => {
  it('accepts the confirmation word, case/space-insensitive', () => {
    expect(isDeleteConfirmation('EXCLUIR')).toBe(true);
    expect(isDeleteConfirmation('  excluir ')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isDeleteConfirmation('')).toBe(false);
    expect(isDeleteConfirmation('EXCLUI')).toBe(false);
    expect(isDeleteConfirmation(undefined)).toBe(false);
    expect(isDeleteConfirmation(1)).toBe(false);
  });
});
