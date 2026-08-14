import type { ja } from './locales/ja.ts'

export const SUPPORTED_LOCALES = ['ja', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

type DeepWiden<T> =
  T extends (...args: infer Args) => infer Result
    ? (...args: Args) => (Result extends string ? string : Result)
    : T extends string
      ? string
      : T extends number
        ? number
        : T extends boolean
          ? boolean
          : T extends readonly unknown[]
            ? { readonly [Key in keyof T]: DeepWiden<T[Key]> }
            : T extends object
              ? { readonly [Key in keyof T]: DeepWiden<T[Key]> }
              : T

/** Every locale module must provide this complete shape. */
export type UiDictionary = DeepWiden<typeof ja>

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
