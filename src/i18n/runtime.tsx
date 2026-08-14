import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { createDisplayName, resolveDisplayName } from '../data/index.ts'
import type { DisplayNameResolver } from '../data/index.ts'
import { en } from './locales/en.ts'
import { ja } from './locales/ja.ts'
import { isLocale } from './types.ts'
import type { Locale, UiDictionary } from './types.ts'

export const LOCALE_STORAGE_KEY = 'satisfactory-planner:locale'

/** Regional tags whose language alone does not identify the intended game locale. */
export const REGION_COLLAPSE_MAP: Readonly<Record<string, string>> = {
  'zh-cn': 'zh-Hans',
  'zh-sg': 'zh-Hans',
  'zh-tw': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'zh-mo': 'zh-Hant',
  'pt-br': 'pt-BR',
  pt: 'pt-BR',
  es: 'es-ES',
} as const

const DICTIONARIES: Readonly<Record<Locale, UiDictionary>> = { ja, en }
const OG_LOCALES: Readonly<Record<Locale, string>> = { ja: 'ja_JP', en: 'en_US' }

let activeLocale: Locale = 'ja'

export function getDictionary(locale: Locale): UiDictionary {
  return DICTIONARIES[locale]
}

export function getActiveLocale(): Locale {
  return activeLocale
}

export function getActiveDictionary(): UiDictionary {
  return getDictionary(activeLocale)
}

function activateLocale(locale: Locale): void {
  activeLocale = locale
}

export function matchSupportedLocale(languageTag: string): Locale | null {
  const normalized = languageTag.trim().replaceAll('_', '-').toLowerCase()
  if (isLocale(normalized)) return normalized

  const collapsed = REGION_COLLAPSE_MAP[normalized]
  if (collapsed !== undefined && isLocale(collapsed)) return collapsed

  const language = normalized.split('-')[0]
  return isLocale(language) ? language : null
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

  return 'ja'
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

/** Resolve official game-name tokens in an otherwise localized UI string. */
export function resolveText(text: string, locale: Locale = activeLocale): string {
  return text.replace(GAME_TERM_PATTERN, (_token, className: string) =>
    resolveDisplayName(className, locale),
  )
}

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  dictionary: UiDictionary
  displayName: DisplayNameResolver
}

const DEFAULT_CONTEXT: LocaleContextValue = {
  locale: 'ja',
  setLocale: () => undefined,
  dictionary: ja,
  displayName: createDisplayName('ja'),
}

const LocaleContext = createContext<LocaleContextValue>(DEFAULT_CONTEXT)

export type LocaleProviderProps = {
  children: ReactNode
  /** Deterministic override for tests and embedded renders. */
  initialLocale?: Locale
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectLocale())

  // The legacy T proxy is read while descendants render, so update it before that render begins.
  activateLocale(locale)

  const setLocale = useCallback((nextLocale: Locale): void => {
    activateLocale(nextLocale)
    setLocaleState(nextLocale)
    storeLocale(nextLocale)
  }, [])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      dictionary: getDictionary(locale),
      displayName: createDisplayName(locale),
    }),
    [locale, setLocale],
  )

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

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (context === DEFAULT_CONTEXT) activateLocale('ja')
  return context
}
