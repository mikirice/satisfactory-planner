export { en } from './locales/en.ts'
export { ja } from './locales/ja.ts'
export { ALTERNATE_NAME_PREFIXES } from './alternate-prefixes.ts'
export {
  LOCALE_STORAGE_KEY,
  LocaleProvider,
  REGION_COLLAPSE_MAP,
  detectLocale,
  getActiveDictionary,
  getActiveLocale,
  getActiveNamePack,
  getDictionary,
  isDictionaryLoaded,
  isLocaleReady,
  loadDictionary,
  matchSupportedLocale,
  preloadLocale,
  resolveText,
  useLocale,
} from './runtime.tsx'
export type { LocaleContextValue, LocaleProviderProps } from './runtime.tsx'
export { BUNDLED_LOCALES, SUPPORTED_LOCALES, isLocale } from './types.ts'
export type { BundledLocale, LazyLocale, Locale, UiDictionary } from './types.ts'
export {
  getLoadedGameNamePack,
  isGameNamePackReady,
  loadGameNamePack,
} from './name-packs.ts'
