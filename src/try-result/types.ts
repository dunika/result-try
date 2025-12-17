import type { ResultError } from "../errors"

export type AsyncOperation<T> = (() => Promise<T>) | Promise<T>

export type SyncOperation<T> = () => T

export type ErrorMapper<E extends ResultError = ResultError> = (error: unknown) => E
