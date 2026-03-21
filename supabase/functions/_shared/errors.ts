// Phase 7.1 — Standardized error handling for all edge functions
// Provides consistent { success, error, code, details } response format

export const toMessage = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

export const toObject = (e: unknown): Record<string, unknown> =>
  e instanceof Error ? { name: e.name, message: e.message, stack: e.stack } :
  typeof e === 'object' && e !== null ? e as Record<string, unknown> :
  { value: e };

// ── Error codes ──────────────────────────────────────────────────────────────
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_MISSING'
  | 'AUTH_INVALID'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'META_API_ERROR'
  | 'PAYMENT_ERROR'
  | 'DB_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_ERROR'
  | 'CONFIG_MISSING';

// ── Structured error class ───────────────────────────────────────────────────
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ── Factory helpers ──────────────────────────────────────────────────────────
export const validationError = (message: string, details?: Record<string, unknown>) =>
  new AppError('VALIDATION_ERROR', message, 400, details);

export const authError = (message = 'Token de autenticação ausente ou inválido') =>
  new AppError('AUTH_MISSING', message, 401);

export const forbiddenError = (message = 'Sem permissão para esta ação') =>
  new AppError('FORBIDDEN', message, 403);

export const notFoundError = (resource: string) =>
  new AppError('NOT_FOUND', `${resource} não encontrado`, 404);

export const rateLimitError = (retryAfterSec = 60) =>
  new AppError('RATE_LIMITED', 'Limite de requisições excedido', 429, { retry_after: retryAfterSec });

export const metaApiError = (message: string, details?: Record<string, unknown>) =>
  new AppError('META_API_ERROR', message, 502, details);

export const configMissingError = (what: string) =>
  new AppError('CONFIG_MISSING', `Configuração ausente: ${what}`, 400);

// ── Response builder ─────────────────────────────────────────────────────────
export interface ErrorResponseBody {
  success: false;
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
  timestamp: string;
}

export function buildErrorBody(err: unknown): { body: ErrorResponseBody; status: number } {
  if (err instanceof AppError) {
    return {
      body: {
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
        timestamp: new Date().toISOString(),
      },
      status: err.statusCode,
    };
  }

  // Unknown errors → INTERNAL_ERROR
  return {
    body: {
      success: false,
      error: toMessage(err),
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
    status: 500,
  };
}
