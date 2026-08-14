import { getActiveDictionary, resolveText } from '../i18n/runtime.tsx'
import type { UiDictionary } from '../i18n/types.ts'

type DictionaryValue = string | number | boolean | readonly unknown[] | object | null

function valueAtPath(path: readonly PropertyKey[]): DictionaryValue {
  let value: unknown = getActiveDictionary()
  for (const key of path) {
    value = Reflect.get(value as object, key)
  }
  return value as DictionaryValue
}

function localizedValue(value: DictionaryValue): DictionaryValue {
  if (typeof value === 'string') return resolveText(value)
  if (Array.isArray(value)) return value.map((entry) => localizedValue(entry as DictionaryValue))
  return value
}

function dictionaryProxy(path: readonly PropertyKey[]): object {
  return new Proxy(
    {},
    {
      get(_target, key) {
        const value = valueAtPath([...path, key])
        if (typeof value === 'function') {
          return (...args: unknown[]) => localizedValue(value(...args) as DictionaryValue)
        }
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return dictionaryProxy([...path, key])
        }
        return localizedValue(value)
      },
      ownKeys() {
        return Reflect.ownKeys(valueAtPath(path) as object)
      },
      getOwnPropertyDescriptor(_target, key) {
        if (!Reflect.has(valueAtPath(path) as object, key)) return undefined
        return { configurable: true, enumerable: true }
      },
    },
  )
}

/** Compatibility facade. Values are read from the active typed dictionary on access. */
export const T = dictionaryProxy([]) as UiDictionary

export type { UiDictionary } from '../i18n/types.ts'
