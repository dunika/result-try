import { describe, expect, it } from "vitest"
import { NotFoundError, ResultError } from "./errors"
import { isResult, Result } from "./result"

describe("Result Type", () => {
  it("should create a success result with Result.ok", () => {
    const okResult = Result.ok(10)
    expect(okResult.ok).toBe(true)
    expect(okResult.value).toBe(10)
    expect(okResult.unwrap()).toBe(10)
  })

  it("should create an error result with Result.error", () => {
    const errorResult = Result.error(ResultError.from("Error"))
    expect(errorResult.ok).toBe(false)
    expect(errorResult.error.message).toBe("Error")
    expect(() => errorResult.unwrap()).toThrow(ResultError)
  })

  it("should create a void result with Result.void", () => {
    const voidResult = Result.void()
    expect(voidResult.ok).toBe(true)
    expect(voidResult.value).toBeUndefined()
  })

  it("should identify results with isResult", () => {
    expect(isResult(Result.ok(1))).toBe(true)
    expect(isResult({ ok: true, value: 1 })).toBe(false)
    expect(isResult(null)).toBe(false)
    expect(isResult({})).toBe(false)
  })

  it("should support array destructuring", () => {
    const [val, err] = Result.ok(10)
    expect(val).toBe(10)
    expect(err).toBeNull()

    const [val2, err2] = Result.error(ResultError.from("oops"))

    expect(val2).toBeNull()
    expect(err2?.message).toBe("oops")

    const [val3, err3] = Result.void()
    expect(val3).toBeUndefined()
    expect(err3).toBeNull()
  })

  it("should support tuple index access", () => {
    const res = Result.ok(10)
    expect(res[0]).toBe(10)
    expect(res[1]).toBeNull()

    const errRes = Result.error(ResultError.from("err"))
    expect(errRes[0]).toBeNull()
    expect(errRes[1]?.message).toBe("err")
  })

  it("should narrow types correctly with control flow", () => {
    const res = Result.ok(10) as Result<number, ResultError>
    const [val, err] = res

    if (err) {
      expect(err.message).toBeDefined()
      return
    }

    expect(val + 5).toBe(15)
  })

  it("should narrow types correctly with value check", () => {
    const res = Result.error(ResultError.from("oops"))
    const [val, err] = res

    if (val !== null) {
      expect(val).toBeDefined()
    } else {
      expect(err?.message).toBe("oops")
    }
  })

  it("should allow direct access using unwrap()", () => {
    const value = Result.ok(10).unwrap()
    expect(value).toBe(10)

    expect(() => Result.error(ResultError.from("fail")).unwrap()).toThrow()
  })

  it("should narrow types correctly in else branch", () => {
    const res = Result.ok(10) as Result<number, ResultError>
    const [val, err] = res

    if (!err) {
      expect(val + 5).toBe(15)
    } else {
      expect(err.message).toBeDefined()
    }
  })
})

describe("Built-in Error Classes", () => {
  it("should provide consistent error shape", () => {
    const notFound = new NotFoundError({ message: "User not found" })
    expect(notFound.code).toBe("NOT_FOUND")
    expect(notFound.status).toBe(404)
  })

  it("should create error result from static method", () => {
    const result = NotFoundError.result("User missing")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND")
    }
  })
})
