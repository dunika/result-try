import type { ResultError } from "./errors"

export type SuccessResult<T> = {
  readonly ok: true
  readonly value: T
  unwrap: () => T
}

export type ErrorResult<E extends ResultError = ResultError> = {
  readonly ok: false
  readonly error: E
  unwrap: () => never
}

export type SuccessTuple<T> = readonly [T, null]

export type ErrorTuple<E extends ResultError = ResultError> = readonly [null, E]

export type Success<T> = SuccessResult<T> & SuccessTuple<T>

export type Failure<E extends ResultError = ResultError> = ErrorResult<E> & ErrorTuple<E>

/**
 * A hybrid type that enables both object access and array destructuring.
 *
 * @example
 * // Object access
 * if (result.ok) { console.log(result.value) }
 *
 * const [val, err] = result
 */
export type Result<T, E extends ResultError = ResultError> = Success<T> | Failure<E>

export type PromiseResult<T, E extends ResultError = ResultError> = Promise<Result<T, E>>

export const Result = {
  ok: <T>(data: T): Success<T> =>
    Object.assign([data, null] as const, {
      ok: true as const,
      value: data,
      unwrap: () => data,
    }),
  error: <E extends ResultError>(error: E): Failure<E> =>
    Object.assign([null, error] as const, {
      ok: false as const,
      error,
      unwrap: () => {
        throw error
      },
    }),
  void: (): Success<void> =>
    Object.assign([undefined, null] as const, {
      ok: true as const,
      value: undefined,
      unwrap: () => undefined,
    }),
}

export function isResult<T = unknown, E extends ResultError = ResultError>(
  value: unknown
): value is Result<T, E> {
  return (
    Array.isArray(value) &&
    value !== null &&
    typeof value === "object" &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  )
}
