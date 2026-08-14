export { en } from './locales/en.ts'
export { ja } from './locales/ja.ts'
export {
  LOCALE_STORAGE_KEY,
  LocaleProvider,
  REGION_COLLAPSE_MAP,
  detectLocale,
  getActiveDictionary,
  getActiveLocale,
  getDictionary,
  matchSupportedLocale,
  resolveText,
  useLocale,
} from './runtime.tsx'
export type { LocaleContextValue, LocaleProviderProps } from './runtime.tsx'
export { SUPPORTED_LOCALES, isLocale } from './types.ts'
export type { Locale, UiDictionary } from './types.ts'
export { loadGameNamePack } from './name-packs.ts'
