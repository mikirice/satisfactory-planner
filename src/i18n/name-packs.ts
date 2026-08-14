import type { GameNamePack } from '../data/index.ts'

type NamePackModule = { default: unknown }
type NamePackLoader = () => Promise<NamePackModule>

/**
 * Vite turns each matching JSON file into its own lazy chunk. Adding `names.<locale>.json`
 * (scripts/build-data.ts) is enough to make a locale's official names available here; Japanese and
 * English continue to use the names already bundled in the normalized data and never request a chunk.
 */
const packModules = import.meta.glob<NamePackModule>('../data/names.*.json') as Readonly<
  Record<string, NamePackLoader>
>

const cache = new Map<string, Promise<GameNamePack | undefined>>()
/** Resolved packs, so that synchronous render paths can read what is already in memory. */
const loaded = new Map<string, GameNamePack>()

export function loadGameNamePack(locale: string): Promise<GameNamePack | undefined> {
  if (locale === 'ja' || locale === 'en') return Promise.resolve(undefined)

  const cached = cache.get(locale)
  if (cached !== undefined) return cached

  const loader = packModules[`../data/names.${locale}.json`]
  if (loader === undefined) return Promise.resolve(undefined)

  const pending = loader().then(({ default: value }) => {
    const pack = validateNamePack(locale, value)
    loaded.set(locale, pack)
    return pack
  })
  cache.set(locale, pending)
  return pending
}

/** The already loaded pack, or undefined when the locale is bundled or not fetched yet. */
export function getLoadedGameNamePack(locale: string): GameNamePack | undefined {
  return loaded.get(locale)
}

/** Whether official names for this locale can be resolved synchronously. */
export function isGameNamePackReady(locale: string): boolean {
  if (locale === 'ja' || locale === 'en') return true
  if (loaded.has(locale)) return true
  // A locale without a pack file falls back to English names, which need no fetch.
  return packModules[`../data/names.${locale}.json`] === undefined
}

function validateNamePack(locale: string, value: unknown): GameNamePack {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Invalid game-name pack for locale ${locale}`)
  }
  for (const [className, name] of Object.entries(value)) {
    if (className === '' || typeof name !== 'string' || name === '') {
      throw new TypeError(`Invalid game-name entry for locale ${locale}: ${className}`)
    }
  }
  return value as GameNamePack
}
