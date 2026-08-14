import { describe, expect, it } from 'vitest'

import namesEnJson from '../src/data/names.en.json'
import {
  belts,
  buildings,
  createDisplayName,
  extractors,
  generators,
  items,
  itemsById,
  pipes,
  recipes,
  resolveDisplayName,
} from '../src/data/index.ts'
import { stripAlternatePrefix } from '../src/ui/format.ts'

const namesEn = namesEnJson as Readonly<Record<string, string>>

describe('official game-name resolution', () => {
  it('resolves IDs, LocalizedName values, and named entities from bundled ja/en data', () => {
    const ironPlate = itemsById.get('Desc_IronPlate_C')!

    expect(resolveDisplayName(ironPlate.id)).toBe('鉄板')
    expect(resolveDisplayName(ironPlate.name, 'en')).toBe('Iron Plate')
    expect(resolveDisplayName(ironPlate, 'en')).toBe('Iron Plate')
    expect(createDisplayName('en')(ironPlate.id)).toBe('Iron Plate')
  })

  it('uses a Tier-2 pack by ClassName and falls back to bundled English', () => {
    const ironPlate = itemsById.get('Desc_IronPlate_C')!
    const displayName = createDisplayName('de', { [ironPlate.id]: 'Eisenplatte' })

    expect(displayName(ironPlate)).toBe('Eisenplatte')
    expect(displayName('Desc_Water_C')).toBe('Water')
    expect(displayName('Unknown_Class_C')).toBe('Unknown_Class_C')
    // A bare LocalizedName has no ClassName lookup key, so Tier-2 correctly falls back to en.
    expect(displayName(ironPlate.name)).toBe('Iron Plate')
  })

  it('emits a sorted complete English pack for every normalized named entity', () => {
    const entities = [
      ...items,
      ...recipes,
      ...buildings,
      ...extractors,
      ...generators,
      ...belts,
      ...pipes,
    ]
    const uniqueIds = [...new Set(entities.map((entity) => entity.id))].sort()

    expect(Object.keys(namesEn)).toEqual(uniqueIds)
    for (const entity of entities) expect(namesEn[entity.id], entity.id).toBe(entity.name.en)
    expect(namesEn.Desc_CrystalShard_C).toBe('Power Shard')
    expect(namesEn.Desc_WAT1_C).toBe('Somersloop')
  })
})

describe('alternate recipe name prefix', () => {
  /**
   * 接頭辞は辞書（ja: 代替 / en: Alternate）から組み立てる。ここが辞書と切れると、
   * 一覧の名前に「代替: 」が残ったり、逆に別の語を削ったりする。
   */
  it('strips the official prefix in both locales, including the full-width colon', () => {
    expect(stripAlternatePrefix('代替: 接着鉄板')).toBe('接着鉄板')
    expect(stripAlternatePrefix('代替：アルクラッド筐体')).toBe('アルクラッド筐体')
    expect(stripAlternatePrefix('Alternate: Adhered Iron Plate')).toBe('Adhered Iron Plate')
    // 接頭辞が無い通常レシピ名は触らない
    expect(stripAlternatePrefix('鉄板')).toBe('鉄板')
    expect(stripAlternatePrefix('Iron Plate')).toBe('Iron Plate')
  })

  it('matches every alternate recipe in the bundled game data', () => {
    const alternates = recipes.filter((recipe) => recipe.isAlternate)

    expect(alternates.length).toBeGreaterThan(0)
    for (const recipe of alternates) {
      expect(stripAlternatePrefix(recipe.name.ja), recipe.id).not.toBe(recipe.name.ja)
      expect(stripAlternatePrefix(recipe.name.en), recipe.id).not.toBe(recipe.name.en)
    }
  })
})
