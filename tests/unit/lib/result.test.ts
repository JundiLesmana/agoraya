import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  andThen,
  orElse,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  match,
  toNullable,
  type Result,
} from '@/lib/result';

describe('lib/result', () => {
  describe('ok / err / isOk / isErr', () => {
    it('wraps a success value', () => {
      const r = ok(42);
      expect(isOk(r)).toBe(true);
      expect(isErr(r)).toBe(false);
      if (isOk(r)) expect(r.value).toBe(42);
    });

    it('wraps an error value', () => {
      const r = err(new Error('boom'));
      expect(isOk(r)).toBe(false);
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error.message).toBe('boom');
    });
  });

  describe('map', () => {
    it('transforms success value', () => {
      const r = map(ok(2), (n) => n * 3);
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(6);
    });

    it('leaves error untouched', () => {
      const e = err('fail');
      const r = map(e, () => 0);
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error).toBe('fail');
    });
  });

  describe('mapErr', () => {
    it('transforms error value', () => {
      const r = mapErr(err('fail'), (e) => `wrapped: ${e}`);
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error).toBe('wrapped: fail');
    });

    it('leaves success untouched', () => {
      const r = mapErr(ok(5), (e) => e);
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(5);
    });
  });

  describe('andThen', () => {
    it('chains fallible operation on success', () => {
      const r = andThen(ok(3), (n) => ok(n + 1));
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(4);
    });

    it('short-circuits on error', () => {
      const r = andThen(err('fail'), () => ok(0));
      expect(isErr(r)).toBe(true);
      if (isErr(r)) expect(r.error).toBe('fail');
    });
  });

  describe('orElse', () => {
    it('recovers from error with fallback', () => {
      const r = orElse(err('fail'), () => ok(42));
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(42);
    });

    it('keeps success when present', () => {
      const r = orElse(ok(7), () => ok(42));
      expect(isOk(r)).toBe(true);
      if (isOk(r)) expect(r.value).toBe(7);
    });
  });

  describe('unwrap', () => {
    it('extracts success value', () => {
      expect(unwrap(ok('x'))).toBe('x');
    });

    it('throws the error otherwise', () => {
      expect(() => unwrap(err(new Error('nope')))).toThrow('nope');
    });
  });

  describe('unwrapOr', () => {
    it('returns success value', () => {
      expect(unwrapOr(ok(5), 0)).toBe(5);
    });

    it('returns default on error', () => {
      expect(unwrapOr(err('fail'), 0)).toBe(0);
    });
  });

  describe('unwrapOrElse', () => {
    it('returns success value', () => {
      expect(unwrapOrElse(ok(5), () => 0)).toBe(5);
    });

    it('computes fallback from error', () => {
      expect(unwrapOrElse(err('fail'), () => 9)).toBe(9);
    });
  });

  describe('match', () => {
    it('folds success', () => {
      expect(match(ok(2), { onOk: (n) => n * 10, onErr: () => -1 })).toBe(20);
    });

    it('folds error', () => {
      expect(match(err('x'), { onOk: (n) => n, onErr: () => -1 })).toBe(-1);
    });
  });

  describe('toNullable', () => {
    it('returns value on success', () => {
      expect(toNullable(ok(1))).toBe(1);
    });

    it('returns null on error', () => {
      expect(toNullable(err('fail'))).toBeNull();
    });
  });

  describe('type narrowing', () => {
    it('Result union narrows correctly', () => {
      const r: Result<number, string> = ok(1);
      if (isOk(r)) {
        const v: number = r.value;
        expect(v).toBe(1);
      }
      const e: Result<number, string> = err('bad');
      if (isErr(e)) {
        const errVal: string = e.error;
        expect(errVal).toBe('bad');
      }
    });
  });
});
