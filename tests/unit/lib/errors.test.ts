import { describe, it, expect, afterEach } from 'vitest';
import {
  AppError,
  ErrorCode,
  formatError,
  isAppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  IdempotencyError,
  type FormattedError,
} from '@/lib/errors';

describe('lib/errors', () => {
  describe('ErrorCode', () => {
    it('exposes stable error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.IDEMPOTENCY_ERROR).toBe('IDEMPOTENCY_ERROR');
    });
  });

  describe('AppError', () => {
    it('carries code, statusCode, and message', () => {
      const e = new AppError(ErrorCode.NOT_FOUND, 'user not found', {
        statusCode: 404,
        context: { userId: 'abc' },
      });
      expect(e.code).toBe(ErrorCode.NOT_FOUND);
      expect(e.statusCode).toBe(404);
      expect(e.message).toBe('user not found');
      expect(e.isOperational).toBe(true);
      expect(e.name).toBe('AppError');
    });

    it('defaults statusCode to 500 and isOperational to true', () => {
      const e = new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'boom');
      expect(e.statusCode).toBe(500);
      expect(e.isOperational).toBe(true);
    });

    it('supports cause', () => {
      const cause = new Error('db down');
      const e = new AppError(ErrorCode.DATABASE_ERROR, 'query failed', { cause, statusCode: 500 });
      expect(e.cause).toBe(cause);
    });
  });

  describe('subclasses with stable defaults', () => {
    it('ValidationError -> 400', () => {
      const e = new ValidationError('bad input');
      expect(e.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(e.statusCode).toBe(400);
    });

    it('NotFoundError -> 404', () => {
      const e = new NotFoundError('missing');
      expect(e.code).toBe(ErrorCode.NOT_FOUND);
      expect(e.statusCode).toBe(404);
    });

    it('UnauthorizedError -> 401', () => {
      const e = new UnauthorizedError('nope');
      expect(e.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(e.statusCode).toBe(401);
    });

    it('ForbiddenError -> 403', () => {
      const e = new ForbiddenError('no access');
      expect(e.code).toBe(ErrorCode.FORBIDDEN);
      expect(e.statusCode).toBe(403);
    });

    it('ConflictError -> 409', () => {
      const e = new ConflictError('dup');
      expect(e.code).toBe(ErrorCode.CONFLICT);
      expect(e.statusCode).toBe(409);
    });

    it('DatabaseError -> 500, non-operational', () => {
      const e = new DatabaseError('conn lost');
      expect(e.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(e.statusCode).toBe(500);
      expect(e.isOperational).toBe(false);
    });

    it('ExternalServiceError -> 502, non-operational', () => {
      const e = new ExternalServiceError('provider down');
      expect(e.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(e.statusCode).toBe(502);
      expect(e.isOperational).toBe(false);
    });

    it('IdempotencyError -> 409', () => {
      const e = new IdempotencyError('replayed');
      expect(e.code).toBe(ErrorCode.IDEMPOTENCY_ERROR);
      expect(e.statusCode).toBe(409);
    });
  });

  describe('isAppError', () => {
    it('narrows AppError instances', () => {
      expect(isAppError(new ValidationError('x'))).toBe(true);
      expect(isAppError(new Error('x'))).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });
  });

  describe('formatError', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('formats AppError without leaking internals in production', () => {
      process.env = { ...originalEnv, NODE_ENV: 'production' };
      const e = new ValidationError('bad field', {
        details: { field: 'email' },
      });
      const out = formatError(e) as FormattedError;
      expect(out.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(out.statusCode).toBe(400);
      expect(out.message).toBe('bad field');
      expect(out.details).toEqual({ field: 'email' });
      expect(out.stack).toBeUndefined();
    });

    it('includes stack in development', () => {
      process.env = { ...originalEnv, NODE_ENV: 'development' };
      const e = new ValidationError('bad field');
      const out = formatError(e) as FormattedError;
      expect(out.stack).toBeDefined();
    });

    it('maps unknown errors to generic 500 without leaking', () => {
      const out = formatError(new Error('raw db error: SELECT * from users')) as FormattedError;
      expect(out.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(out.statusCode).toBe(500);
      expect(out.message).toBe('Internal server error');
      expect(out.stack).toBeUndefined();
    });
  });
});
