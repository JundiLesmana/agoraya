export const ErrorCode = {
  ENV_VALIDATION_FAILED: 'ENV_VALIDATION_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  IDEMPOTENCY_ERROR: 'IDEMPOTENCY_ERROR',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface AppErrorOptions {
  readonly statusCode?: number;
  readonly isOperational?: boolean;
  readonly cause?: unknown;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface FormattedError {
  readonly code: string;
  readonly statusCode: number;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly stack?: string;
}

export class AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
  cause?: unknown;
  context?: Readonly<Record<string, unknown>>;
  details?: Readonly<Record<string, unknown>>;

  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = options.statusCode ?? 500;
    this.isOperational = options.isOperational ?? true;
    this.cause = options.cause;
    this.context = options.context;
    this.details = options.details;
  }

  toJSON(): FormattedError {
    const output: FormattedError = {
      code: this.code,
      statusCode: this.statusCode,
      message: this.message,
    };
    if (this.details) {
      return { ...output, details: { ...this.details } };
    }
    return output;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Format an error for client consumption. Never leaks internals in production. */
export function formatError(
  error: unknown,
  options: { readonly isDev?: boolean } = {},
): FormattedError {
  const isDev = options.isDev ?? process.env.NODE_ENV === 'development';

  if (isAppError(error)) {
    let formatted: FormattedError = {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
    };
    if (error.details) formatted = { ...formatted, details: { ...error.details } };
    if (isDev && error.stack) formatted = { ...formatted, stack: error.stack };
    return formatted;
  }

  return {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: 500,
    message: 'Internal server error',
  };
}

export class ValidationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.VALIDATION_ERROR, message, { statusCode: 400, ...options });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.NOT_FOUND, message, { statusCode: 404, ...options });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.UNAUTHORIZED, message, { statusCode: 401, ...options });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.FORBIDDEN, message, { statusCode: 403, ...options });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.CONFLICT, message, { statusCode: 409, ...options });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.DATABASE_ERROR, message, { statusCode: 500, isOperational: false, ...options });
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, message, { statusCode: 502, isOperational: false, ...options });
  }
}

export class IdempotencyError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(ErrorCode.IDEMPOTENCY_ERROR, message, { statusCode: 409, ...options });
  }
}
