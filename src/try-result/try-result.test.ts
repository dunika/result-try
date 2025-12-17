import { describe, expect, it } from "vitest"
import { ResultError } from "../errors"
import { tryResult, tryResultSync } from "./try-result"

describe("tryResult", () => {
  it("should handle a Promise resolving successfully", async () => {
    const promiseResult = await tryResult(Promise.resolve({ ok: true }))
    if (promiseResult.ok) {
      expect(promiseResult.value).toEqual({ ok: true })
    }
  })

  it("should handle an async function resolving successfully", async () => {
    const asyncResult = await tryResult(async () => {
      const response = { ok: true, json: async () => ({ data: "test" }) }
      if (!response.ok) throw new Error("Fetch failed")
      return response.json()
    })
    expect(asyncResult.ok).toBe(true)
  })

  it("should handle a rejected Promise/async function", async () => {
    const mappedResult = await tryResult(
      Promise.reject(new Error("Network error")),
      (error) => new ResultError("Custom failure message", error)
    )
    expect(mappedResult.ok).toBe(false)
    if (!mappedResult.ok) {
      expect(mappedResult.error.message).toBe("Custom failure message")
    }
  })

  it("should support array destructuring", async () => {
    const [val, err] = await tryResult(Promise.resolve(10))
    expect(val).toBe(10)
    expect(err).toBeNull()

    const [val2, err2] = await tryResult(Promise.reject(new Error("error")))
    expect(val2).toBeNull()
    expect(err2).toBeInstanceOf(ResultError)
  })

  it("should support type narrowing with if checks", async () => {
    const [val, err] = await tryResult(Promise.resolve("hello"))

    if (err) {
      expect.fail("Should not have error")
    }

    expect(val.toUpperCase()).toBe("HELLO")

    const [_val2, err2] = await tryResult(Promise.reject(new Error("fail")))
    if (err2) {
      expect(err2.message).toBe("fail")
    } else {
      expect.fail("Should have error")
    }
  })
})

describe("tryResultSync", () => {
  it("should handle a sync function returning successfully", () => {
    const syncResult = tryResultSync(() => {
      return JSON.parse('{"valid": "json"}')
    })
    expect(syncResult.ok).toBe(true)
  })

  it("should handle a sync function throwing an error", () => {
    const mappedResult = tryResultSync(
      () => JSON.parse("invalid"),
      (error) => ResultError.from(error)
    )
    expect(mappedResult.ok).toBe(false)
  })

  it("should support array destructuring", () => {
    const [val, err] = tryResultSync(() => 10)
    expect(val).toBe(10)
    expect(err).toBeNull()

    const [val2, err2] = tryResultSync(() => {
      throw new Error("error")
    })

    expect(val2).toBeNull()
    expect(err2).toBeInstanceOf(ResultError)
  })
})
