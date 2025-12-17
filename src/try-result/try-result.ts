import { ResultError } from "../errors"
import { type PromiseResult, Result } from "../result"
import type { AsyncOperation, ErrorMapper, SyncOperation } from "./types"

export function tryResult<T, E extends ResultError = ResultError>(
  operation: AsyncOperation<T>,
  errorMapper: ErrorMapper<E> = ResultError.from as ErrorMapper<E>
): PromiseResult<T, E> {
  const promise = operation instanceof Promise ? operation : operation()

  return promise.then(Result.ok).catch((caught) => {
    const mappedError = errorMapper(caught)
    return Result.error(mappedError)
  })
}

export function tryResultSync<T, E extends ResultError = ResultError>(
  operation: SyncOperation<T>,
  errorMapper: ErrorMapper<E> = ResultError.from as ErrorMapper<E>
): Result<T, E> {
  try {
    const value = operation()
    return Result.ok(value)
  } catch (caught) {
    const mappedError = errorMapper(caught)
    return Result.error(mappedError)
  }
}
