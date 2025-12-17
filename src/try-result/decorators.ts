import { ResultError } from "../errors"
import { Result } from "../result"
import type { ErrorMapper } from "./types"

export function TryResult<E extends ResultError = ResultError>(errorMapper?: ErrorMapper<E>) {
  return (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>

    descriptor.value = async function (...args: unknown[]) {
      try {
        const result = await originalMethod.apply(this, args)
        if (result instanceof ResultError) {
          return Result.error(result as E)
        }
        return Result.ok(result)
      } catch (error) {
        const mappedError = errorMapper ? errorMapper(error) : (ResultError.from(error) as E)
        return Result.error(mappedError)
      }
    }

    return descriptor
  }
}

export function TryResultSync<E extends ResultError = ResultError>(errorMapper?: ErrorMapper<E>) {
  return (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown

    descriptor.value = function (...args: unknown[]) {
      try {
        const result = originalMethod.apply(this, args)
        if (result instanceof ResultError) {
          return Result.error(result as E)
        }
        return Result.ok(result)
      } catch (error) {
        const mappedError = errorMapper ? errorMapper(error) : (ResultError.from(error) as E)
        return Result.error(mappedError)
      }
    }

    return descriptor
  }
}
