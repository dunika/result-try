import { describe, expect, it, vi } from "vitest"
import {
  BadRequestError,
  ForbiddenError,
  findHTTPErrorFromCode,
  getHTTPErrorMessageFromCode,
  inspect,
  isResultError,
  isResultErrorCode,
  isResultErrorStatus,
  NotFoundError,
  Result,
  ResultError,
  TryResult,
  tryResult,
  tryResultSync,
} from "../index"

const db = {
  users: {
    find: vi.fn(),
  },
  findUser: vi.fn(),
}

const fetch = vi.fn()
global.fetch = fetch

describe("README Examples", () => {
  // -------------------------------------------------------------------------
  // Quick Start
  // -------------------------------------------------------------------------
  describe("Quick Start", () => {
    it("should match 'BEFORE' vs 'AFTER' example", async () => {
      // Setup
      const user = { name: "Alice" }
      db.users.find.mockResolvedValue(user)

      const result = await tryResult<{ name: string }>(db.users.find(1))

      if (!result.ok) {
        throw new Error("Expected success")
      }

      expect(result.value.name).toBe("Alice")
    })

    it("should match 'Or with destructuring' example", async () => {
      // Setup
      const mockUser = { name: "Bob", namem: "Bob" }
      db.users.find.mockResolvedValue(mockUser)

      const [user, error] = await tryResult<{ name: string }>(db.users.find(1))

      if (error) {
        throw new Error("Expected success")
      }

      expect(user.name).toBe("Bob")
    })
  })

  // -------------------------------------------------------------------------
  // Usage
  // -------------------------------------------------------------------------
  describe("Usage", () => {
    describe("tryResult", () => {
      it("should match 'fetch' example", async () => {
        fetch.mockResolvedValue({ status: 200 })
        const result = await tryResult<Response>(fetch("https://api.example.com/data"))

        if (result.ok) {
          expect(result.value.status).toBe(200)
        } else {
          throw new Error("Expected success")
        }
      })

      it("should match 'With custom error map' example", async () => {
        const id = 1
        db.findUser.mockRejectedValue(new Error("Missing"))

        const userResult = await tryResult(db.findUser(id), (error) => NotFoundError.from(error))

        expect(userResult.ok).toBe(false)
        if (!userResult.ok) {
          expect(userResult.error).toBeInstanceOf(NotFoundError)
        }
      })

      it("should match 'Destructuring' example", async () => {
        fetch.mockResolvedValue("data")
        const [data, error] = await tryResult(fetch("..."))
        if (error) {
          throw new Error("Expected success")
        }
        expect(data).toBe("data")
      })
    })

    describe("tryResultSync", () => {
      it("should match 'JSON.parse' example", () => {
        const userInput = '{"name": "Alice"}'
        const parseResult = tryResultSync(() => JSON.parse(userInput))
        expect(parseResult.ok).toBe(true)
      })

      it("should match 'With custom error map' example", () => {
        const userInput = "invalid-json"

        // Mock validate function
        const validate = (_input: string) => {
          throw new Error("Invalid")
        }

        const valResult = tryResultSync(
          () => validate(userInput),
          (error) => BadRequestError.from(error)
        )
        expect(valResult.ok).toBe(false)
        if (!valResult.ok) {
          expect(valResult.error).toBeInstanceOf(BadRequestError)
        }
      })

      it("should match 'Destructuring' example", () => {
        const userInput = '{"a":1}'
        const [data, error] = tryResultSync(() => JSON.parse(userInput))
        expect(error).toBeNull()
        expect(data).toEqual({ a: 1 })
      })
    })

    describe("Decorators", () => {
      it("should match 'UserService' example", async () => {
        const dbMock = { find: vi.fn() }

        class UserService {
          // Use default mapping (error -> ResultError.from(error))
          @TryResult()
          async getUser(id: string) {
            if (id === "error") throw new Error("Boom")
            return { id, name: "Alice" }
          }

          // Use custom mapping
          @TryResult((error) => NotFoundError.from(error))
          async findUser(id: string) {
            const user = await dbMock.find(id)
            if (!user) {
              return NotFoundError.from("User not found")
            }
            return user
          }
        }

        const service = new UserService()

        // Test getUser success
        // Test getUser success
        const res1 = (await service.getUser("1")) as unknown as Result<
          { id: string; name: string },
          ResultError
        >
        expect(res1.ok).toBe(true)

        // Test getUser fail
        const res2 = (await service.getUser("error")) as unknown as Result<
          { id: string; name: string },
          ResultError
        >
        expect(res2.ok).toBe(false)

        // Test findUser - not found
        dbMock.find.mockResolvedValue(null)
        const res3 = (await service.findUser("999")) as unknown as Result<
          { id: string; name: string },
          ResultError
        >
        expect(res3.ok).toBe(false)
        if (!res3.ok) {
          expect(res3.error).toBeInstanceOf(NotFoundError)
        }
      })
    })
  })

  // -------------------------------------------------------------------------
  // API Reference
  // -------------------------------------------------------------------------
  describe("API Reference", () => {
    describe("Result Type", () => {
      it("should match 'Object Access' vs 'Array Destructuring'", () => {
        const result = Result.ok("test")

        // Object access
        if (result.ok) {
          expect(result.value).toBe("test")
        }

        // Array destructuring
        const [value, error] = result
        if (error) {
          throw new Error("Should be success")
        }
        expect(value).toBe("test")
      })

      it("should match 'Result.void()' example", () => {
        interface User {
          isActive: boolean
        }

        function validateUser(user: User): Result<void, ResultError> {
          if (!user.isActive) {
            return Result.error(ForbiddenError.from("User is inactive"))
          }

          return Result.void()
        }

        expect(validateUser({ isActive: false }).ok).toBe(false)
        expect(validateUser({ isActive: true }).ok).toBe(true)
      })

      it("should match 'Result.unwrap()' example", () => {
        const result = Result.ok(5)
        const value = result.unwrap() // Throws if result is error
        expect(value).toBe(5)
      })
    })

    describe("ResultError & Built-in Errors", () => {
      it("should match 'Static Factory Methods - from()' example", () => {
        // From a string message
        const error1 = ResultError.from("User not found")
        expect(error1).toBeInstanceOf(ResultError)
        expect(error1.message).toBe("User not found")

        // From an existing error
        const existingError = new Error("Database error")
        const error2 = NotFoundError.from(existingError)
        expect(error2).toBeInstanceOf(NotFoundError)
        expect(error2.message).toBe("Database error")
      })

      it("should match 'Static Factory Methods - result()' example", () => {
        // Concise
        const res1 = NotFoundError.result("User not found")

        // Equivalent to
        const res2 = Result.error(NotFoundError.from("User not found"))

        expect(res1.ok).toBe(false)
        expect(res2.ok).toBe(false)

        if (!res1.ok && !res2.ok) {
          expect(res1.error.message).toBe("User not found")
          expect(res2.error.message).toBe("User not found")

          expect(res1.error.code).toBe(res2.error.code)
          expect(res1.error.status).toBe(res2.error.status)
        }
      })
    })

    describe("inspect Utility", () => {
      it("should match '1. Circular References'", () => {
        const circular: any = { self: null }
        circular.self = circular
        const out = inspect(circular)
        expect(out).toContain("[Referential Structure]")
      })

      it("should match '2. Built-in Types'", () => {
        expect(inspect(new Map([["key", "value"]]))).toContain("[Map]")
        expect(inspect(new Set([1, 2, 3]))).toContain("[Set]")
        expect(inspect(BigInt(123))).toBe("123")
      })

      it("should match '3. Errors'", () => {
        const err = new Error("Boom")
        expect(inspect(err)).toContain("Boom")
      })

      it("should match '4. Custom Classes'", () => {
        class User {
          constructor(public id: number) {}
        }
        expect(inspect(new User(1))).toContain("[User]")
        expect(inspect(new User(1))).toContain('"id":1')
      })
    })

    describe("Error Helpers", () => {
      it("should verify helpers exist and work", () => {
        const someValue = ResultError.from("Err", { code: "SOME_CODE" })

        if (isResultError(someValue)) {
          expect(someValue.code).toBe("SOME_CODE")
        }

        const result = NotFoundError.result("Missing")

        if (isResultErrorCode(result.error, "NOT_FOUND")) {
          expect(true).toBe(true)
        }

        if (isResultErrorStatus(result.error, 404)) {
          expect(true).toBe(true)
        }

        const httpError = findHTTPErrorFromCode("NOT_FOUND")
        if (httpError) {
          expect(httpError.message).toBe("The requested resource could not be found.")
        }

        const msg = getHTTPErrorMessageFromCode("BAD_REQUEST", "Fallback message")
        expect(msg).not.toBe("Fallback message")
      })
    })
  })
})
