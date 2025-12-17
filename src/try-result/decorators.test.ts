import { beforeEach, describe, expect, it } from "vitest"

import { ResultError } from "../errors"
import { TryResult, TryResultSync } from "./decorators"

class TestService {
  @TryResult()
  async success(value: number) {
    return value * 2
  }

  @TryResult()
  async fail(message: string) {
    throw new Error(message)
  }

  @TryResultSync()
  syncSuccess(value: number) {
    return value * 2
  }

  @TryResultSync()
  syncFail(message: string) {
    throw new Error(message)
  }
}

describe("Decorators", () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
  })

  describe("@TryResult", () => {
    it("should return success result", async () => {
      const result = await service.success(5)
      expect((result as any).ok).toBe(true)
      if ((result as any).ok) {
        expect((result as any).value).toBe(10)
      }
    })

    it("should return failure result on error", async () => {
      const result = await service.fail("boom")
      expect((result as any).ok).toBe(false)
      if (!(result as any).ok) {
        expect((result as any).error).toBeInstanceOf(ResultError)
        expect((result as any).error.message).toBe("boom")
      }
    })
  })

  describe("@TryResultSync", () => {
    it("should return success result", () => {
      const result = service.syncSuccess(5)
      expect((result as any).ok).toBe(true)
      if ((result as any).ok) {
        expect((result as any).value).toBe(10)
      }
    })

    it("should return failure result on error", () => {
      const result = service.syncFail("boom")
      expect((result as any).ok).toBe(false)
      if (!(result as any).ok) {
        expect((result as any).error).toBeInstanceOf(ResultError)
        expect((result as any).error.message).toBe("boom")
      }
    })
  })

  describe("README Examples", () => {
    it("should behave as documented", async () => {
      class UserService {
        @TryResult()
        async getUser(id: string) {
          if (!id) throw new Error("ID required")
          return { id, name: "User" }
        }

        @TryResult((error) => new ResultError("Failed to get user", error))
        async getUserSafe(_id: string) {
          throw new Error("Database error")
        }
      }

      const userService = new UserService()
      const result1 = await userService.getUser("1")
      expect((result1 as any).ok).toBe(true)
      // @ts-expect-error: checking runtime value definition that types hide
      expect(result1.value).toEqual({ id: "1", name: "User" })

      const result2 = await userService.getUser("")
      expect((result2 as any).ok).toBe(false)

      const result3 = await userService.getUserSafe("1")
      expect((result3 as any).ok).toBe(false)
      if (!(result3 as any).ok) {
        expect((result3 as any).error.message).toBe("Failed to get user")
      }

      class MathService {
        @TryResultSync()
        divide(a: number, b: number) {
          if (b === 0) throw new Error("Division by zero")
          return a / b
        }
      }

      const mathService = new MathService()
      const divResult = mathService.divide(10, 2)
      expect((divResult as any).ok).toBe(true)
      // @ts-expect-error: checking runtime value definition that types hide
      expect(divResult.value).toBe(5)

      const divError = mathService.divide(10, 0)
      expect((divError as any).ok).toBe(false)
    })
  })
})
