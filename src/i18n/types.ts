import type { ja } from './locales/ja.ts'

/**
 * 対応言語（計画書 §3）。
 *
 * Tier 0: ja / Tier 1: en / Tier 2: 以降の10言語。
 * ここに足すと、言語横断スモークと共有URLのテストが自動で全言語に広がる（tests/locale.test.tsx）。
 * RTL（ar/he）は計画書 §3 のとおり初期対象外（レイアウトの鏡像対応が別工事のため）。
 */
export const SUPPORTED_LOCALES = [
  'ja',
  'en',
  'de',
  'fr',
  'es-ES',
  'pt-BR',
  'ru',
  'zh-Hans',
  'zh-Hant',
  'ko',
  'pl',
  'tr',
] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** 初期バンドルに常駐する言語。ほかは動的 import で取り寄せる（計画書 §8）。 */
export const BUNDLED_LOCALES = ['ja', 'en'] as const

export type BundledLocale = (typeof BUNDLED_LOCALES)[number]

/** 動的 import で読み込む言語（Tier 2）。 */
export type LazyLocale = Exclude<Locale, BundledLocale>

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
