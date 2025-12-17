import { describe, expect, it } from "vitest"
import { inspect } from "./inspect"

describe("inspect()", () => {
  it("should handle circular references", () => {
    const circular: any = { prop: "value" }
    circular.self = circular

    const result = inspect(circular)
    expect(result).toBe('[Referential Structure]:{"prop":"value","self":"[Circular]"}')
  })

  it("should handle Map", () => {
    const map = new Map()
    map.set("key1", "value1")
    map.set("key2", "value2")
    map.set(123, true)
    const result = inspect(map)
    expect(result).toBe('[Map]:[["key1","value1"],["key2","value2"],[123,true]]')

    const emptyMap = new Map()
    expect(inspect(emptyMap)).toBe("[Map]:[]")
  })

  it("should handle Set", () => {
    const set = new Set()
    set.add("value1")
    set.add("value2")
    set.add(123)
    const result = inspect(set)
    expect(result).toBe('[Set]:["value1","value2",123]')

    const emptySet = new Set()
    expect(inspect(emptySet)).toBe("[Set]:[]")
  })

  it("should handle Date", () => {
    const date = new Date("2024-01-01T00:00:00.000Z")
    const result = inspect(date)
    expect(result).toBe("2024-01-01T00:00:00.000Z")

    const invalidDate = new Date("invalid")
    expect(inspect(invalidDate)).toBe("Invalid Date")
  })

  it("should handle Error", () => {
    const error = new Error("test error")
    const result = inspect(error)
    expect(result).toContain("[Error]:{")
    expect(result).toContain('"message":"test error"')
    expect(result).toContain('"name":"Error"')
  })

  it("should handle Error subclasses", () => {
    const typeError = new TypeError("invalid type")
    const result = inspect(typeError)
    expect(result).toContain("[TypeError]:{")
    expect(result).toContain('"name":"TypeError"')
    expect(result).toContain('"message":"invalid type"')
  })

  it("should handle RegExp", () => {
    const regexp = /abc/g
    const result = inspect(regexp)
    expect(result).toBe("/abc/g")
  })

  it("should handle URL", () => {
    const url = new URL("https://example.com/path")
    const result = inspect(url)
    expect(result).toBe("https://example.com/path")
  })

  it("should handle complex serialization (serialize check)", () => {
    const complex = {
      map: new Map([["key", "value"]]),
      set: new Set([1]),
    }
    const result = inspect(complex)
    expect(result).toBe('{"map":[["key","value"]],"set":[1]}')
  })

  it.each([
    {
      value: null,
      expected: "null",
    },
    {
      value: undefined,
      expected: "undefined",
    },
    {
      value: 42,
      expected: "42",
    },
    {
      value: "test",
      expected: "test",
    },
    {
      value: true,
      expected: "true",
    },
    {
      value: false,
      expected: "false",
    },
    {
      value: BigInt(123),
      expected: "123",
    },
    {
      value: Symbol("sym"),
      expected: "Symbol(sym)",
    },
  ])("should inspect primitives: $expected", ({ value, expected }) => {
    expect(inspect(value)).toBe(expected)
  })

  it("should inspect functions", () => {
    function testFunc() {
      return "hello"
    }

    expect(inspect(testFunc)).toBe("[Function]:testFunc")

    expect(inspect(() => {})).toBe("[Function]:anonymous")
  })

  it("should inspect objects", () => {
    const obj = {
      key: "value",
      num: 123,
    }
    expect(inspect(obj)).toBe('{"key":"value","num":123}')
  })

  it("should inspect arrays", () => {
    const arr = [1, "two", true]
    expect(inspect(arr)).toBe('[1,"two",true]')
  })

  it("should handle nested special primitives", () => {
    const obj = {
      undef: undefined,
      big: BigInt(9007199254740991),
      inf: Infinity,
    }
    const result = inspect(obj)
    expect(result).toBe('{"undef":null,"big":"9007199254740991","inf":"Infinity"}')
  })

  it("should handle edge cases and special types", () => {
    expect(inspect(NaN)).toBe("NaN")
    expect(inspect(Infinity)).toBe("Infinity")
    expect(inspect(-Infinity)).toBe("-Infinity")

    expect(inspect(new WeakMap())).toBe("[WeakMap]")
    expect(inspect(new WeakSet())).toBe("[WeakSet]")
    expect(inspect(Promise.resolve())).toBe("[Promise]")

    class CustomClass {
      constructor(public val: string) {}
    }
    expect(inspect(new CustomClass("hello"))).toBe('[CustomClass]:{"val":"hello"}')

    class CustomPromise extends Promise<void> {}
    expect(inspect(new CustomPromise(() => {}))).toBe("[CustomPromise]")

    expect(inspect(-0)).toBe("-0")
    expect(inspect(new ArrayBuffer(8))).toBe("[ArrayBuffer]:[0,0,0,0,0,0,0,0]")
    expect(inspect(new URLSearchParams("q=hello"))).toBe('[URLSearchParams]:"q=hello"')
  })

  it("should handle repeated references", () => {
    const obj = { a: 1 }
    const repeated = [obj, obj]
    expect(inspect(repeated)).toBe('[{"a":1},{"a":1}]')
  })

  it("should handle non-serializable objects", () => {
    const nonSerializable = {
      get prop() {
        throw new Error("Cannot access")
      },
    }
    expect(inspect(nonSerializable)).toContain("[Non-Serializable]")
  })
})
