// Agoraya — lib/result
// Result type for functional error handling: Ok<T> | Err<E>.
// Zero-cost discriminated union. Pure functions, no runtime reflection, no `any`.

export type Ok<T> = { readonly kind: 'ok'; readonly value: T };
export type Err<E> = { readonly kind: 'err'; readonly error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

/** Wrap a successful value. */
export function ok<T>(value: T): Ok<T> {
  return { kind: 'ok', value };
}

/** Wrap an error value. */
export function err<E>(error: E): Err<E> {
  return { kind: 'err', error };
}

/** Narrow the result to its success case. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.kind === 'ok';
}

/** Narrow the result to its error case. */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.kind === 'err';
}

/** Transform the success value, leaving errors untouched. */
export function map<T, U, E>(result: Result<T, E>, f: (value: T) => U): Result<U, E> {
  return result.kind === 'ok' ? ok(f(result.value)) : err(result.error);
}

/** Transform the error value, leaving successes untouched. */
export function mapErr<T, E, F>(result: Result<T, E>, f: (error: E) => F): Result<T, F> {
  return result.kind === 'err' ? err(f(result.error)) : ok(result.value);
}

/** Chain a fallible operation on the success value. */
export function andThen<T, U, E>(result: Result<T, E>, f: (value: T) => Result<U, E>): Result<U, E> {
  return result.kind === 'ok' ? f(result.value) : err(result.error);
}

/** Recover from an error with a fallback Result. */
export function orElse<T, E, F>(result: Result<T, E>, f: (error: E) => Result<T, F>): Result<T, F> {
  return result.kind === 'err' ? f(result.error) : ok(result.value);
}

/** Extract the success value, throwing the error otherwise. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.kind === 'err') throw result.error;
  return result.value;
}

/** Extract the success value or a default. */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.kind === 'ok' ? result.value : defaultValue;
}

/** Extract the success value or compute it from the error. */
export function unwrapOrElse<T, E>(result: Result<T, E>, f: (error: E) => T): T {
  return result.kind === 'ok' ? result.value : f(result.error);
}

/** Fold the result into a single value. */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: { readonly onOk: (value: T) => U; readonly onErr: (error: E) => U },
): U {
  return result.kind === 'ok' ? handlers.onOk(result.value) : handlers.onErr(result.error);
}

/** Convert to a nullable value (null on error). */
export function toNullable<T, E>(result: Result<T, E>): T | null {
  return result.kind === 'ok' ? result.value : null;
}

/** Async variant of map. */
export async function mapAsync<T, U, E>(
  result: Result<T, E>,
  f: (value: T) => Promise<U>,
): Promise<Result<U, E>> {
  return result.kind === 'ok' ? ok(await f(result.value)) : err(result.error);
}

/** Async variant of andThen. */
export async function andThenAsync<T, U, E>(
  result: Result<T, E>,
  f: (value: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> {
  return result.kind === 'ok' ? await f(result.value) : err(result.error);
}
