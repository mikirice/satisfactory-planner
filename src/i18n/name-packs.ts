import type { GameNamePack } from '../data/index.ts'

type NamePackModule = { default: unknown }
type NamePackLoader = () => Promise<NamePackModule>

/**
 * Vite turns each matching JSON file into its own lazy chunk. Stage 2 can add
 * `names.<locale>.json` without changing this runtime; Japanese and English continue to use the
 * names already bundled in the normalized data and never request these chunks.
 */
const packModules = import.meta.glob<NamePackModule>('../data/names.*.json') as Readonly<
  Record<string, NamePackLoader>
>

const cache = new Map<string, Promise<GameNamePack | undefined>>()

export function loadGameNamePack(locale: string): Promise<GameNamePack | undefined> {
  if (locale === 'ja' || locale === 'en') return Promise.resolve(undefined)

  const cached = cache.get(locale)
  if (cached !== undefined) return cached

  const loader = packModules[`../data/names.${locale}.json`]
  if (loader === undefined) return Promise.resolve(undefined)

  const pending = loader().then(({ default: value }) => validateNamePack(locale, value))
  cache.set(locale, pending)
  return pending
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
