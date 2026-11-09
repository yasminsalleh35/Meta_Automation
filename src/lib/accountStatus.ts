// Status de conta que bloqueiam o login (ADM-02 suspensa; audit LGL-03 exclusão pedida).

export const ACCOUNT_SUSPENDED_MESSAGE = 'Sua conta está suspensa. Entre em contato com o suporte.';
export const ACCOUNT_PENDING_DELETION_MESSAGE =
  'Sua conta está em processo de exclusão. Para cancelar, fale com o suporte em até 30 dias.';

/** Mensagem de bloqueio para um profiles.status, ou null se a conta pode entrar. */
export function accountBlockMessage(status: string | null | undefined): string | null {
  if (status === 'suspended') return ACCOUNT_SUSPENDED_MESSAGE;
  if (status === 'pending_deletion') return ACCOUNT_PENDING_DELETION_MESSAGE;
  return null;
}

export function isAccountBlockMessage(message: string | null | undefined): boolean {
  return message === ACCOUNT_SUSPENDED_MESSAGE || message === ACCOUNT_PENDING_DELETION_MESSAGE;
}

/** audit LGL-03: palavra digitada para confirmar a exclusão. Mesma constante em supabase/functions/_shared/dataSubject.ts. */
export const DELETE_ACCOUNT_CONFIRMATION_WORD = 'EXCLUIR';

export function isDeleteConfirmation(input: unknown): boolean {
  return typeof input === 'string' && input.trim().toUpperCase() === DELETE_ACCOUNT_CONFIRMATION_WORD;
}
