import { HTTP_ERRORS } from "./http-errors"
import { ResultError } from "./result-error"

export function findHTTPErrorFromCode(code: string) {
  return Object.values(HTTP_ERRORS).find((e) => e.code === code)
}

export function getHTTPErrorMessageFromCode(
  code: string,
  fallback = "An unexpected error occurred"
): string {
  const error = findHTTPErrorFromCode(code)
  return error?.message ?? fallback
}

export function isResultError(value: unknown): value is ResultError {
  return value instanceof ResultError
}

export function isResultErrorCode(error: unknown, code: string): boolean {
  return isResultError(error) && error.code === code
}

export function isResultErrorStatus(error: unknown, status: number): boolean {
  return isResultError(error) && error.status === status
}
