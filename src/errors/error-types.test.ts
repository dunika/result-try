import { describe, expect, it } from "vitest"
import {
  BadGatewayError,
  BadRequestError,
  ClientClosedRequestError,
  ConflictError,
  ForbiddenError,
  GatewayTimeoutError,
  InternalServerError,
  MethodNotAllowedError,
  NotAcceptableError,
  NotFoundError,
  NotImplementedError,
  PayloadTooLargeError,
  PreconditionFailedError,
  ServiceUnavailableError,
  TimeoutError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableContentError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
} from "./http-error-types"
import { HTTP_ERRORS } from "./http-errors"
import { ResultError } from "./result-error"

const errorTypes = [
  {
    ErrorClass: BadRequestError,
    exception: HTTP_ERRORS.BAD_REQUEST,
  },
  {
    ErrorClass: UnauthorizedError,
    exception: HTTP_ERRORS.UNAUTHORIZED,
  },
  {
    ErrorClass: ForbiddenError,
    exception: HTTP_ERRORS.FORBIDDEN,
  },
  {
    ErrorClass: NotFoundError,
    exception: HTTP_ERRORS.NOT_FOUND,
  },
  {
    ErrorClass: MethodNotAllowedError,
    exception: HTTP_ERRORS.METHOD_NOT_ALLOWED,
  },
  {
    ErrorClass: NotAcceptableError,
    exception: HTTP_ERRORS.NOT_ACCEPTABLE,
  },
  {
    ErrorClass: TimeoutError,
    exception: HTTP_ERRORS.TIMEOUT,
  },
  {
    ErrorClass: ConflictError,
    exception: HTTP_ERRORS.CONFLICT,
  },
  {
    ErrorClass: PreconditionFailedError,
    exception: HTTP_ERRORS.PRECONDITION_FAILED,
  },
  {
    ErrorClass: PayloadTooLargeError,
    exception: HTTP_ERRORS.PAYLOAD_TOO_LARGE,
  },
  {
    ErrorClass: UnsupportedMediaTypeError,
    exception: HTTP_ERRORS.UNSUPPORTED_MEDIA_TYPE,
  },
  {
    ErrorClass: UnprocessableEntityError,
    exception: HTTP_ERRORS.UNPROCESSABLE_ENTITY,
  },
  {
    ErrorClass: UnprocessableContentError,
    exception: HTTP_ERRORS.UNPROCESSABLE_CONTENT,
  },
  {
    ErrorClass: TooManyRequestsError,
    exception: HTTP_ERRORS.TOO_MANY_REQUESTS,
  },
  {
    ErrorClass: ClientClosedRequestError,
    exception: HTTP_ERRORS.CLIENT_CLOSED_REQUEST,
  },
  {
    ErrorClass: InternalServerError,
    exception: HTTP_ERRORS.INTERNAL_SERVER_ERROR,
  },
  {
    ErrorClass: NotImplementedError,
    exception: HTTP_ERRORS.NOT_IMPLEMENTED,
  },
  {
    ErrorClass: BadGatewayError,
    exception: HTTP_ERRORS.BAD_GATEWAY,
  },
  {
    ErrorClass: ServiceUnavailableError,
    exception: HTTP_ERRORS.SERVICE_UNAVAILABLE,
  },
  {
    ErrorClass: GatewayTimeoutError,
    exception: HTTP_ERRORS.GATEWAY_TIMEOUT,
  },
] as const

describe("Error Types", () => {
  describe.each(errorTypes)("$ErrorClass.name", ({ ErrorClass, exception: _exception }) => {
    it("should return the same instance when passed an instance of itself", () => {
      const instance = new ErrorClass()
      const result = ErrorClass.from(instance)
      expect(result).toBe(instance)
    })

    it("should wrap an Error with correct message and cause", () => {
      const originalError = new Error("Original error message")
      // inheritance
      const wrapped = ErrorClass.from(originalError)

      expect(wrapped).toBeInstanceOf(ErrorClass)
      expect(wrapped).toBeInstanceOf(ResultError)
      expect(wrapped.message).toBe("Original error message")
      expect(wrapped.cause).toBeInstanceOf(ResultError)
    })

    it("should wrap a string error", () => {
      const wrapped = ErrorClass.from("string error")

      expect(wrapped).toBeInstanceOf(ErrorClass)
      expect(wrapped).toBeInstanceOf(ResultError)
      expect(wrapped.message).toBe("string error")
      expect(wrapped.cause).toBeInstanceOf(ResultError)
    })

    it("should wrap a ResultError from a different error type", () => {
      const caught = ResultError.from(new Error("base error"))
      // inheritance
      const wrapped = ErrorClass.from(caught)

      expect(wrapped).toBeInstanceOf(ErrorClass)
      expect(wrapped.message).toBe("base error")
      expect(wrapped.cause).toBe(caught)
    })

    describe("result()", () => {
      it("should return an error Result", () => {
        const result = ErrorClass.result("test error")

        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(result.error).toBeInstanceOf(ErrorClass)
          expect(result.error.message).toBe("test error")
        }
      })

      it("should return an error Result that throws on unwrap", () => {
        const result = ErrorClass.result("test error")

        expect(() => result.unwrap()).toThrow(ErrorClass)
      })
    })
  })
})

describe("ResultError.result()", () => {
  it("should return an error Result from the base class", () => {
    const error = new Error("base error")
    const result = ResultError.result(error)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ResultError)
      expect(result.error.message).toBe("base error")
      expect(result.error.code).toBe("INTERNAL_SERVER_ERROR")
      expect(result.error.cause).toBeInstanceOf(Error)
    }
  })

  it("should allow options", () => {
    const error = new Error("custom error")
    const result = ResultError.result(error, { code: "CUSTOM_CODE", status: 418 })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe("CUSTOM_CODE")
      expect(result.error.status).toBe(418)
    }
  })
})
