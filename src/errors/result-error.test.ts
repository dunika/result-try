import { describe, expect, it } from "vitest"

import { ResultError } from "./result-error"

describe("ResultError", () => {
  it("should create a basic failure", () => {
    const failure = new ResultError("Something went wrong", undefined)
    expect(failure.message).toBe("Something went wrong")
    expect(failure.code).toBe("INTERNAL_SERVER_ERROR")
    expect(failure.status).toBe(500)
    expect(failure).toBeInstanceOf(Error)
    expect(failure).toBeInstanceOf(ResultError)
  })

  it("should create a failure with custom code and status", () => {
    const failure = new ResultError("Custom error", undefined, {
      code: "CUSTOM_ERROR",
      status: 400,
    })
    expect(failure.code).toBe("CUSTOM_ERROR")
    expect(failure.status).toBe(400)
  })

  it("should be instance of Error and ResultError", () => {
    const caught = ResultError.from("test")

    expect(caught).toBeInstanceOf(Error)
    expect(caught).toBeInstanceOf(ResultError)
  })
  describe("from()", () => {
    it("should return the same instance when passed a ResultError", () => {
      const original = ResultError.from(new Error("Original error"))
      const result = ResultError.from(original)

      expect(result).toBe(original)
    })

    it("should handle Error instances", () => {
      const error = new Error("Test error message")
      const caught = ResultError.from(error)

      expect(caught).toBeInstanceOf(ResultError)
      expect(caught).toBeInstanceOf(Error)
      expect(caught.message).toBe("Test error message")
      expect(caught.cause).toBe(error)
      expect(caught.name).toBe("ResultError(Error)")
    })

    it.each([
      {
        ErrorClass: TypeError,
        expectedName: "ResultError(TypeError)",
      },
      {
        ErrorClass: RangeError,
        expectedName: "ResultError(RangeError)",
      },
    ])("should handle Error subclass: $ErrorClass.name", ({ ErrorClass, expectedName }) => {
      const error = new ErrorClass("test message")
      const caught = ResultError.from(error)

      expect(caught.message).toBe("test message")
      expect(caught.name).toBe(expectedName)
      expect(caught.cause).toBe(error)
    })

    it.each([
      {
        value: "String error",
        expectedMessage: "String error",
        type: "string",
      },
      {
        value: 42,
        expectedMessage: "42",
        type: "number",
      },
      {
        value: 0,
        expectedMessage: "0",
        type: "number",
      },
      {
        value: true,
        expectedMessage: "true",
        type: "boolean",
      },
      {
        value: false,
        expectedMessage: "false",
        type: "boolean",
      },
      {
        value: null,
        expectedMessage: "null",
        type: "null",
      },
      {
        value: undefined,
        expectedMessage: "undefined",
        type: "undefined",
      },
      {
        value: BigInt(12345),
        expectedMessage: "12345",
        type: "bigint",
      },
      {
        value: Symbol("test"),
        expectedMessage: "Symbol(test)",
        type: "symbol",
      },
    ])("should handle primitive $type: $value", ({ value, expectedMessage, type }) => {
      const caught = ResultError.from(value)

      expect(caught.message).toBe(expectedMessage)
      expect(caught.cause).toBe(value)
      expect(caught.name).toBe(`ResultError(${type})`)
    })

    it("should stringify and identify object types", () => {
      const date = new Date("2025-10-22T00:00:00.000Z")
      const testCases = [
        {
          value: {
            foo: "bar",
            baz: 123,
          },
          expectedName: "ResultError(Object)",
          expectedMessage: '{"foo":"bar","baz":123}',
        },
        {
          value: [1, 2, 3],
          expectedName: "ResultError(Array)",
          expectedMessage: "[1,2,3]",
        },
        {
          value: date,
          expectedName: "ResultError(Date)",
          expectedMessage: "2025-10-22T00:00:00.000Z",
        },
      ]

      testCases.forEach(({ value, expectedName, expectedMessage }) => {
        const caught = ResultError.from(value)
        expect(caught.name).toBe(expectedName)
        expect(caught.cause).toBe(value)
        expect(caught.message).toBe(expectedMessage)
      })
    })

    it("should handle non-serializable objects", () => {
      const circular: Record<string, unknown> = {
        prop: "value",
      }

      ;(circular as any).self = circular

      const caught = ResultError.from(circular)

      expect(caught.message).toBe('[Referential Structure]:{"prop":"value","self":"[Circular]"}')
      expect(caught.cause).toBe(circular)
    })

    it("should handle functions", () => {
      function namedFunction() {}
      const caught = ResultError.from(namedFunction)

      expect(caught.message).toBe("[Function]:namedFunction")
      expect(caught.cause).toBe(namedFunction)
      expect(caught.name).toBe("ResultError(function)")
    })
  })

  describe("stack traces", () => {
    it("should have readable stack traces", () => {
      const errorCaught = ResultError.from(new Error("Test error"))
      const stringCaught = ResultError.from("String error")

      ;[errorCaught, stringCaught].forEach((caught) => {
        expect(caught.stack).toBeDefined()

        if (caught.stack) {
          const lines = caught.stack.split("\n")
          expect(lines[0]).toBe(`${caught.name}: ${caught.message}`)

          expect(lines.slice(1).every((line) => line.trim().startsWith("at"))).toBe(true)
        }
      })
    })

    it("should point to call site, not constructor", () => {
      const caught = ResultError.from("test")

      expect(caught.stack).toContain("result-error.test.ts")
      expect(caught.stack).not.toContain("new ResultError")
    })

    it("should preserve original error stack in cause", () => {
      const error = new Error("Original")
      const originalStack = error.stack
      const caught = ResultError.from(error)

      expect((caught.cause as Error).stack).toBe(originalStack)
    })
  })
})
