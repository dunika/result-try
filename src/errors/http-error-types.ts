import { type Failure, Result } from "../result"
import { HTTP_ERRORS } from "./http-errors"
import { ResultError } from "./result-error"

function createErrorClass<T extends (typeof HTTP_ERRORS)[keyof typeof HTTP_ERRORS]>(config: T) {
  return class extends ResultError {
    constructor(
      options?: {
        message?: string | undefined
        cause?: unknown
      } & Record<string, unknown>
    ) {
      super(options?.message ?? config.message ?? undefined, options?.cause, {
        code: config.code,
        status: config.status,
        name: config.name,
      })

      Object.assign(this, options)
    }

    static override from(caught: unknown): ResultError {
      // biome-ignore lint/complexity/noThisInStatic: standard factory pattern
      if (caught instanceof this) {
        return caught
      }

      const base = ResultError.from(caught)

      // biome-ignore lint/complexity/noThisInStatic: standard factory pattern
      return new this({
        message: base.message ?? undefined,
        cause: base,
      })
    }

    static override result(message?: string, cause?: unknown): Failure<ResultError> {
      return Result.error(
        // biome-ignore lint/complexity/noThisInStatic: standard factory pattern
        new this({ message, cause })
      )
    }
  }
}

export class BadRequestError extends createErrorClass(HTTP_ERRORS.BAD_REQUEST) {}
export class UnauthorizedError extends createErrorClass(HTTP_ERRORS.UNAUTHORIZED) {}
export class PaymentRequiredError extends createErrorClass(HTTP_ERRORS.PAYMENT_REQUIRED) {}
export class ForbiddenError extends createErrorClass(HTTP_ERRORS.FORBIDDEN) {}
export class NotFoundError extends createErrorClass(HTTP_ERRORS.NOT_FOUND) {}
export class MethodNotAllowedError extends createErrorClass(HTTP_ERRORS.METHOD_NOT_ALLOWED) {}
export class NotAcceptableError extends createErrorClass(HTTP_ERRORS.NOT_ACCEPTABLE) {}
export class TimeoutError extends createErrorClass(HTTP_ERRORS.TIMEOUT) {}
export class ConflictError extends createErrorClass(HTTP_ERRORS.CONFLICT) {}
export class PreconditionFailedError extends createErrorClass(HTTP_ERRORS.PRECONDITION_FAILED) {}
export class PayloadTooLargeError extends createErrorClass(HTTP_ERRORS.PAYLOAD_TOO_LARGE) {}
export class UnsupportedMediaTypeError extends createErrorClass(
  HTTP_ERRORS.UNSUPPORTED_MEDIA_TYPE
) {}
export class UnprocessableEntityError extends createErrorClass(HTTP_ERRORS.UNPROCESSABLE_ENTITY) {}
export class UnprocessableContentError extends createErrorClass(
  HTTP_ERRORS.UNPROCESSABLE_CONTENT
) {}
export class TooManyRequestsError extends createErrorClass(HTTP_ERRORS.TOO_MANY_REQUESTS) {}
export class ClientClosedRequestError extends createErrorClass(HTTP_ERRORS.CLIENT_CLOSED_REQUEST) {}
export class InternalServerError extends createErrorClass(HTTP_ERRORS.INTERNAL_SERVER_ERROR) {}
export class NotImplementedError extends createErrorClass(HTTP_ERRORS.NOT_IMPLEMENTED) {}
export class BadGatewayError extends createErrorClass(HTTP_ERRORS.BAD_GATEWAY) {}
export class ServiceUnavailableError extends createErrorClass(HTTP_ERRORS.SERVICE_UNAVAILABLE) {}
export class GatewayTimeoutError extends createErrorClass(HTTP_ERRORS.GATEWAY_TIMEOUT) {}
