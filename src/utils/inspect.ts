export function inspect(value: unknown): string {
  if (Object.is(value, -0)) {
    return "-0"
  }

  if (typeof value === "function") {
    return `[Function]:${value.name || "anonymous"}`
  }

  if (typeof value !== "object" || value === null) {
    return String(value)
  }

  const result = transformValue(value)

  // Opaque = use raw string output
  // e.g. Dates, RegExp, URL
  if (result.kind === "opaque") {
    return result.output
  }

  // Complex, JSON-like output
  // e.g. Map, Set, Error, Arrays, Plain Objects
  try {
    const { json, isReferential } = safeStringify(result.value)

    if (isReferential) {
      return `[Referential Structure]:${json}`
    }

    return result.prefix ? `${result.prefix}${json}` : json
  } catch {
    return `[Non-Serializable]:${Object.prototype.toString.call(value)}`
  }
}

type TransformationResult =
  | { kind: "opaque"; output: string }
  | { kind: "serializable"; prefix: string; value: unknown }

/**
 * Transforms any object into a format suitable for inspection.
 * Decides whether an object should be treated as:
 * - Opaque: Returned as a raw string (e.g. Date, Promise)
 * - Serializable: Converted to a prefix + JSON structure (e.g. Map, Error)
 */
function transformValue(value: object): TransformationResult {
  if (value instanceof Date) {
    return {
      kind: "opaque",
      output: Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString(),
    }
  }
  if (value instanceof RegExp || value instanceof URL) {
    return { kind: "opaque", output: value.toString() }
  }

  // Native Types: Serializable (Prefix + JSON)
  if (value instanceof ArrayBuffer) {
    return {
      kind: "serializable",
      prefix: "[ArrayBuffer]:",
      value: Array.from(new Uint8Array(value)),
    }
  }
  if (value instanceof URLSearchParams) {
    return {
      kind: "serializable",
      prefix: "[URLSearchParams]:",
      value: value.toString(),
    }
  }
  if (value instanceof Map) {
    return {
      kind: "serializable",
      prefix: "[Map]:",
      value: Array.from(value.entries()),
    }
  }
  if (value instanceof Set) {
    return {
      kind: "serializable",
      prefix: "[Set]:",
      value: Array.from(value.values()),
    }
  }
  if (value instanceof Error) {
    const errObj: Record<string, unknown> = { ...value }
    errObj.message = value.message
    errObj.name = value.name
    return {
      kind: "serializable",
      prefix: `[${value.name}]:`,
      value: errObj,
    }
  }

  // Custom Classes & opaque handles
  if (
    value.constructor &&
    value.constructor.name !== "Object" &&
    value.constructor.name !== "Array"
  ) {
    const name = value.constructor.name

    // Opaque Custom Types - can only return their name as string
    if (value instanceof Promise || value instanceof WeakMap || value instanceof WeakSet) {
      return { kind: "opaque", output: `[${name}]` }
    }

    // Serializable Custom Types e.g. class instances, Error subclasses
    return { kind: "serializable", prefix: `[${name}]:`, value }
  }

  // Default: Plain Object / Array
  return { kind: "serializable", prefix: "", value }
}

function safeStringify(value: unknown): { json: string; isReferential: boolean } {
  const valueTransformer = (_key: string, val: unknown) => {
    if (typeof val === "bigint") {
      return val.toString()
    }

    if (val instanceof Map) {
      return Array.from(val.entries())
    }

    if (val instanceof Set) {
      return Array.from(val.values()) as unknown[]
    }

    if (val === undefined) {
      return null
    }

    if (typeof val === "number") {
      if (Number.isNaN(val)) {
        return "NaN"
      }
      if (!Number.isFinite(val)) {
        return val > 0 ? "Infinity" : "-Infinity"
      }
    }
    return val
  }

  try {
    const json = JSON.stringify(value, valueTransformer)
    return { json, isReferential: false }
  } catch {
    const seen = new WeakSet()

    const safeTransformer = (key: string, val: unknown) => {
      const transformedValue = valueTransformer(key, val)

      // Check for circular objects
      if (typeof transformedValue === "object" && transformedValue !== null) {
        if (seen.has(transformedValue)) {
          return "[Circular]"
        }
        seen.add(transformedValue)
      }
      return transformedValue
    }

    const json = JSON.stringify(value, safeTransformer)

    return { json, isReferential: true }
  }
}
