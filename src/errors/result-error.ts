import { type Failure, Result } from "../result"
import { inspect } from "../utils/inspect"
import { HTTP_ERRORS } from "./http-errors"

export type ResultErrorOptions = {
  code?: string
  status?: number
  name?: string
}

export class ResultError extends Error {
  public readonly code: string
  public readonly status: number

  constructor(message: string, cause: unknown, options?: ResultErrorOptions) {
    super(message, {
      cause,
    })

    this.code = options?.code ?? HTTP_ERRORS.INTERNAL_SERVER_ERROR.code
    this.status = options?.status ?? HTTP_ERRORS.INTERNAL_SERVER_ERROR.status

    this.name = options?.name ?? this.#getName(cause)

    if ("captureStackTrace" in Error) {
      Error.captureStackTrace(this, ResultError)
    }
  }

  #getName(cause: unknown): string {
    if (cause instanceof Error) {
      return `ResultError(${cause.name})`
    }

    return `ResultError(${this.#describeType(cause)})`
  }

  static from = (cause: unknown, options?: ResultErrorOptions): ResultError => {
    if (cause instanceof ResultError) {
      return cause
    }

    if (cause instanceof Error) {
      return new ResultError(cause.message, cause, options)
    }

    const stringified = inspect(cause)

    return new ResultError(stringified, cause, options)
  }

  static result(cause?: unknown, options?: ResultErrorOptions): Failure<ResultError> {
    return Result.error(ResultError.from(cause, options))
  }

  #describeType(value: unknown): string {
    if (value === null) {
      return "null"
    }

    if (typeof value === "object" && value.constructor.name) {
      return value.constructor.name
    }

    return typeof value
  }

  #serializeCause(cause: unknown): unknown {
    if (cause instanceof ResultError) {
      return cause.toJSON()
    }

    if (cause instanceof Error) {
      return {
        name: cause.name,
        message: cause.message,
        stack: cause.stack,
        cause: this.#serializeCause(cause.cause),
      }
    }

    return cause
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      cause: this.#serializeCause(this.cause),
    }
  }
}
