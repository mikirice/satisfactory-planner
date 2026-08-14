import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { createDisplayName, resolveDisplayName } from '../data/index.ts'
import type { DisplayNameResolver, GameNamePack } from '../data/index.ts'
import { en } from './locales/en.ts'
import { ja } from './locales/ja.ts'
import { getLoadedGameNamePack, isGameNamePackReady, loadGameNamePack } from './name-packs.ts'
import { SUPPORTED_LOCALES, isLocale } from './types.ts'
import type { LazyLocale, Locale, UiDictionary } from './types.ts'

export const LOCALE_STORAGE_KEY = 'satisfactory-planner:locale'

/** Regional tags whose language alone does not identify the intended game locale. */
export const REGION_COLLAPSE_MAP: Readonly<Record<string, string>> = {
  zh: 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-sg': 'zh-Hans',
  'zh-tw': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'zh-mo': 'zh-Hant',
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-BR',
  pt: 'pt-BR',
  es: 'es-ES',
  'es-419': 'es-ES',
} as const

/** Lowercased tag → canonical locale identifier (`zh-hant` → `zh-Hant`). */
const CANONICAL_LOCALES: Readonly<Record<string, Locale>> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale.toLowerCase(), locale]),
)

/**
 * Dictionaries that stay in the initial bundle. Every other language is fetched on demand
 * (計画書 §8「バンドル肥大」), so the first paint costs the same as before Stage 2.
 */
const BUNDLED_DICTIONARIES: Readonly<Record<string, UiDictionary>> = { ja, en }

/**
 * Tier-2 dictionaries. Each entry becomes its own chunk; the import specifiers are written out
 * literally because Vite needs a statically analyzable path per locale.
 */
const LAZY_DICTIONARIES: Readonly<Record<LazyLocale, () => Promise<UiDictionary>>> = {
  de: () => import('./locales/de.ts').then((module) => module.de),
  fr: () => import('./locales/fr.ts').then((module) => module.fr),
  'es-ES': () => import('./locales/es-ES.ts').then((module) => module.esES),
  'pt-BR': () => import('./locales/pt-BR.ts').then((module) => module.ptBR),
  ru: () => import('./locales/ru.ts').then((module) => module.ru),
  'zh-Hans': () => import('./locales/zh-Hans.ts').then((module) => module.zhHans),
  'zh-Hant': () => import('./locales/zh-Hant.ts').then((module) => module.zhHant),
  ko: () => import('./locales/ko.ts').then((module) => module.ko),
  pl: () => import('./locales/pl.ts').then((module) => module.pl),
  tr: () => import('./locales/tr.ts').then((module) => module.tr),
}

const OG_LOCALES: Readonly<Record<Locale, string>> = {
  ja: 'ja_JP',
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  'es-ES': 'es_ES',
  'pt-BR': 'pt_BR',
  ru: 'ru_RU',
  'zh-Hans': 'zh_CN',
  'zh-Hant': 'zh_TW',
  ko: 'ko_KR',
  pl: 'pl_PL',
  tr: 'tr_TR',
}

const dictionaries = new Map<Locale, UiDictionary>([
  ['ja', ja],
  ['en', en],
])
const pendingDictionaries = new Map<Locale, Promise<UiDictionary>>()

let activeLocale: Locale = 'ja'
let activeNamePack: GameNamePack | undefined

/**
 * The dictionary of a locale that is already in memory.
 *
 * A Tier-2 locale that has not been fetched yet resolves to English instead of throwing:
 * the provider never displays such a locale (it waits for the chunk), and callers outside React
 * — Excel export, tests — get a complete dictionary rather than a crash.
 */
export function getDictionary(locale: Locale): UiDictionary {
  return dictionaries.get(locale) ?? BUNDLED_DICTIONARIES.en
}

/** Whether the dictionary of this locale can be read synchronously. */
export function isDictionaryLoaded(locale: Locale): boolean {
  return dictionaries.has(locale)
}

/** Fetch (once) and register the dictionary of a locale. */
export function loadDictionary(locale: Locale): Promise<UiDictionary> {
  const loaded = dictionaries.get(locale)
  if (loaded !== undefined) return Promise.resolve(loaded)

  const pending = pendingDictionaries.get(locale)
  if (pending !== undefined) return pending

  const load = LAZY_DICTIONARIES[locale as LazyLocale]
  if (load === undefined) return Promise.resolve(getDictionary(locale))

  const request = load().then((dictionary) => {
    dictionaries.set(locale, dictionary)
    pendingDictionaries.delete(locale)
    return dictionary
  })
  pendingDictionaries.set(locale, request)
  return request
}

/** Whether both the dictionary and the official names of a locale are ready to render. */
export function isLocaleReady(locale: Locale): boolean {
  return isDictionaryLoaded(locale) && isGameNamePackReady(locale)
}

/**
 * Load everything a locale needs before it is displayed.
 * Switching only after this resolves is what keeps the UI from flashing a half-translated screen.
 */
export async function preloadLocale(locale: Locale): Promise<void> {
  await Promise.all([loadDictionary(locale), loadGameNamePack(locale)])
}

export function getActiveLocale(): Locale {
  return activeLocale
}

export function getActiveDictionary(): UiDictionary {
  return getDictionary(activeLocale)
}

/** Official names of the active locale (undefined for ja/en, which are bundled). */
export function getActiveNamePack(): GameNamePack | undefined {
  return activeNamePack
}

function activateLocale(locale: Locale): void {
  activeLocale = locale
  activeNamePack = getLoadedGameNamePack(locale)
}

export function matchSupportedLocale(languageTag: string): Locale | null {
  const normalized = languageTag.trim().replaceAll('_', '-').toLowerCase()
  if (normalized === '') return null

  const exact = CANONICAL_LOCALES[normalized]
  if (exact !== undefined) return exact

  const collapsed = REGION_COLLAPSE_MAP[normalized]
  if (collapsed !== undefined && isLocale(collapsed)) return collapsed

  const language = normalized.split('-')[0]
  const byLanguage = CANONICAL_LOCALES[language]
  if (byLanguage !== undefined) return byLanguage

  const collapsedLanguage = REGION_COLLAPSE_MAP[language]
  return collapsedLanguage !== undefined && isLocale(collapsedLanguage) ? collapsedLanguage : null
}

export function detectLocale(
  languages: readonly string[] = browserLanguages(),
  storedLocale: unknown = readStoredLocale(),
): Locale {
  if (isLocale(storedLocale)) return storedLocale

  for (const language of languages) {
    const matched = matchSupportedLocale(language)
    if (matched !== null) return matched
  }

  // 計画書 §4.3「非対応言語は en」。日本語ブラウザは上のマッチで ja になるので影響しない。
  return 'en'
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  if (navigator.languages.length > 0) return navigator.languages
  return navigator.language === '' ? [] : [navigator.language]
}

function readStoredLocale(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Storage can be unavailable in privacy modes; the in-memory selection still works.
  }
}

const GAME_TERM_PATTERN = /\{\{([A-Za-z0-9_]+)\}\}/g

/**
 * Resolve official game-name tokens in an otherwise localized UI string.
 *
 * Callers that already hold a pack (the Excel export receives one from the component that
 * triggered the download) can pass it in; otherwise the pack of that locale is read from the
 * loader cache, which is where every rendered locale keeps its names.
 */
export function resolveText(
  text: string,
  locale: Locale = activeLocale,
  pack: GameNamePack | undefined = locale === activeLocale
    ? activeNamePack
    : getLoadedGameNamePack(locale),
): string {
  return text.replace(GAME_TERM_PATTERN, (_token, className: string) =>
    resolveDisplayName(className, locale, pack),
  )
}

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  dictionary: UiDictionary
  displayName: DisplayNameResolver
  /** Official names of the displayed locale, for consumers that resolve names themselves. */
  namePack: GameNamePack | undefined
  /**
   * A locale the user picked whose chunk is still loading. The current language keeps rendering
   * until it resolves, so the switcher can show the pending choice without a half-translated UI.
   */
  pendingLocale: Locale | null
}

const DEFAULT_CONTEXT: LocaleContextValue = {
  locale: 'ja',
  setLocale: () => undefined,
  dictionary: ja,
  displayName: createDisplayName('ja'),
  namePack: undefined,
  pendingLocale: null,
}

const LocaleContext = createContext<LocaleContextValue>(DEFAULT_CONTEXT)

export type LocaleProviderProps = {
  children: ReactNode
  /** Deterministic override for tests and embedded renders. */
  initialLocale?: Locale
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [wantedLocale] = useState<Locale>(() => initialLocale ?? detectLocale())
  // A Tier-2 locale whose chunks are not in memory yet would render English strings mixed with
  // its own labels. Show the fallback until the preload below finishes.
  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocaleReady(wantedLocale) ? wantedLocale : fallbackLocaleFor(wantedLocale),
  )
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(() =>
    isLocaleReady(wantedLocale) ? null : wantedLocale,
  )
  const requestedLocale = useRef<Locale>(wantedLocale)

  // The legacy T proxy is read while descendants render, so update it before that render begins.
  activateLocale(locale)

  const applyLocale = useCallback((next: Locale): void => {
    activateLocale(next)
    setLocaleState(next)
    setPendingLocale(null)
  }, [])

  const requestLocale = useCallback(
    (next: Locale, persist: boolean): void => {
      requestedLocale.current = next
      if (persist) storeLocale(next)
      if (isLocaleReady(next)) {
        applyLocale(next)
        return
      }
      setPendingLocale(next)
      void preloadLocale(next).then(
        () => {
          if (requestedLocale.current === next) applyLocale(next)
        },
        () => {
          // Keep the current language on a failed fetch (offline, chunk 404) instead of
          // dropping the user into a half-translated screen.
          if (requestedLocale.current === next) setPendingLocale(null)
        },
      )
    },
    [applyLocale],
  )

  const setLocale = useCallback(
    (next: Locale): void => requestLocale(next, true),
    [requestLocale],
  )

  // Finish the initial selection when it needs a chunk (stored choice or browser language).
  // Later changes go through setLocale, so this only has to fire for the very first request.
  useEffect(() => {
    if (wantedLocale !== requestedLocale.current) return
    if (isLocaleReady(wantedLocale)) return
    requestLocale(wantedLocale, false)
  }, [requestLocale, wantedLocale])

  const value = useMemo<LocaleContextValue>(() => {
    const namePack = getLoadedGameNamePack(locale)
    return {
      locale,
      setLocale,
      dictionary: getDictionary(locale),
      displayName: createDisplayName(locale, namePack),
      namePack,
      pendingLocale,
    }
  }, [locale, pendingLocale, setLocale])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
    let ogLocale = document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')
    if (ogLocale === null) {
      ogLocale = document.createElement('meta')
      ogLocale.setAttribute('property', 'og:locale')
      document.head.appendChild(ogLocale)
    }
    ogLocale.content = OG_LOCALES[locale]
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/**
 * What to show while a locale is still loading. English is the plan's default for
 * unsupported languages (計画書 §4.3), and it is already in the bundle.
 */
function fallbackLocaleFor(locale: Locale): Locale {
  return locale === 'ja' ? 'ja' : 'en'
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (context === DEFAULT_CONTEXT) activateLocale('ja')
  return context
}
