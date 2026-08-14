/**
 * Tier 2（計画書 §3 の10言語）の公式名パックのテスト。
 *
 * 見たいのは次の4点。
 * 1. パックが en と**同じキー集合**を持つこと（画面のどこかだけ名前が消える事故を防ぐ）
 * 2. 既知アイテムの綴りが**ゲーム公式訳**と一致すること（計画書 §6-5 のスポットチェック）
 *    期待値は実データ `src/data/names.<locale>.json` から採った実在の文字列を直書きする。
 *    ここを実装と同じ経路で引いてしまうと「何とでも一致するテスト」になるため、あえて写す
 * 3. 未訳（en へのフォールバック）の件数が meta.json の記録と合い、閾値を超えないこと（同 §6-6）
 * 4. パックに無い ClassName は英語名に落ちること（欠落訳のフォールバック規約）
 *
 * 遅延読み込みそのもの（切替時にフラッシュしない・初期バンドルが増えない）は
 * tests/locale.test.tsx が担当する。
 */
import { describe, expect, it } from 'vitest'

import { meta, resolveDisplayName } from '../src/data/index.ts'
import { SUPPORTED_LOCALES, loadGameNamePack } from '../src/i18n/index.ts'
import type { Locale } from '../src/i18n/index.ts'
import namesEn from '../src/data/names.en.json' with { type: 'json' }

/** ja/en は正規化データにバンドル済みなので、パックを持つのは Tier 2 だけ。 */
const TIER2_LOCALES = SUPPORTED_LOCALES.filter(
  (locale): locale is Exclude<Locale, 'ja' | 'en'> => locale !== 'ja' && locale !== 'en',
)

/**
 * 公式訳のスポットチェック。ゲーム内表記と照合できることがこのツールの売りなので、
 * 代表的な4件（原料・中間素材・最終素材・建物）を言語ごとに固定する。
 */
const SPOT_CHECKS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  de: {
    Desc_IronPlate_C: 'Eisenplatte',
    Desc_OreIron_C: 'Eisenerz',
    Recipe_IngotIron_C: 'Eisenbarren',
    Build_ConstructorMk1_C: 'Konstruktor',
  },
  fr: {
    Desc_IronPlate_C: 'Plaque de fer',
    Desc_OreIron_C: 'Minerai de fer',
    Recipe_IngotIron_C: 'Lingot de fer',
    Build_ConstructorMk1_C: 'Constructeur',
  },
  'es-ES': {
    Desc_IronPlate_C: 'Plancha de hierro',
    Desc_OreIron_C: 'Mineral de hierro',
    Recipe_IngotIron_C: 'Lingote de hierro',
    Build_ConstructorMk1_C: 'Constructor',
  },
  'pt-BR': {
    Desc_IronPlate_C: 'Chapa de Ferro',
    Desc_OreIron_C: 'Minério de Ferro',
    Recipe_IngotIron_C: 'Lingote de Ferro',
    Build_ConstructorMk1_C: 'Construtor',
  },
  ru: {
    Desc_IronPlate_C: 'Железная пластина',
    Desc_OreIron_C: 'Железная руда',
    Recipe_IngotIron_C: 'Железный слиток',
    Build_ConstructorMk1_C: 'Конструктор',
  },
  'zh-Hans': {
    Desc_IronPlate_C: '铁板',
    Desc_OreIron_C: '铁矿石',
    Recipe_IngotIron_C: '铁锭',
    Build_ConstructorMk1_C: '构筑站',
  },
  'zh-Hant': {
    Desc_IronPlate_C: '鐵板',
    Desc_OreIron_C: '鐵礦石',
    Recipe_IngotIron_C: '鐵錠',
    Build_ConstructorMk1_C: '製造機',
  },
  ko: {
    Desc_IronPlate_C: '철판',
    Desc_OreIron_C: '철 광석',
    Recipe_IngotIron_C: '철 주괴',
    Build_ConstructorMk1_C: '제작기',
  },
  pl: {
    Desc_IronPlate_C: 'Żelazna płyta',
    Desc_OreIron_C: 'Ruda żelaza',
    Recipe_IngotIron_C: 'Sztaba żelaza',
    Build_ConstructorMk1_C: 'Konstruktor',
  },
  tr: {
    Desc_IronPlate_C: 'Demir Plaka',
    Desc_OreIron_C: 'Demir Cevheri',
    Recipe_IngotIron_C: 'Demir Külçesi',
    Build_ConstructorMk1_C: 'Üretici',
  },
}

/**
 * 未訳（＝en へフォールバック）の許容数。0 で固定する。
 * ゲーム側の Docs はどの言語も全エントリを持っているため、1件でも増えたら
 * 取得元かパイプラインが壊れている合図になる。
 */
const MAX_MISSING = 0

describe('Tier 2 の公式名パック', () => {
  it('10言語ぶんある（計画書 §3 の Tier 2）', () => {
    expect(TIER2_LOCALES).toEqual([
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
    ])
  })

  it.each(TIER2_LOCALES)('%s: en と同じキー集合を持つ', async (locale) => {
    const pack = await loadGameNamePack(locale)
    expect(pack).toBeDefined()
    expect(Object.keys(pack!).sort()).toEqual(Object.keys(namesEn).sort())
    // 空文字の表示名を作らない
    expect(Object.values(pack!).filter((name) => name === '')).toEqual([])
  })

  it.each(TIER2_LOCALES)('%s: 既知アイテムの綴りが公式訳と一致する', async (locale) => {
    const pack = await loadGameNamePack(locale)
    for (const [id, expected] of Object.entries(SPOT_CHECKS[locale])) {
      expect(pack![id], `${locale}: ${id}`).toBe(expected)
      // 画面が使う解決経路でも同じ文字列になる
      expect(resolveDisplayName(id, locale, pack)).toBe(expected)
    }
  })

  it.each(TIER2_LOCALES)('%s: 未訳が閾値以下で、meta.json の記録と一致する', async (locale) => {
    const pack = await loadGameNamePack(locale)
    const fallbacks = meta.nameFallbacks[locale]
    expect(fallbacks, `meta.json に ${locale} の記録が無い`).toBeDefined()

    // 「en と同じ文字列」を数え直し、ビルド時の記録と突き合わせる
    const sameAsEnglish = Object.entries(namesEn).filter(
      ([id, enName]) => pack![id] === enName,
    ).length
    expect(fallbacks.missing).toBeLessThanOrEqual(MAX_MISSING)
    expect(fallbacks.sameAsEnglish).toBe(sameAsEnglish)
  })

  it('パックに無い ClassName は英語名に落ちる（欠落訳のフォールバック）', async () => {
    const pack = await loadGameNamePack('de')
    // データに存在しない ID はそのまま見えるのが従来どおりの挙動
    expect(resolveDisplayName('Desc_DoesNotExist_C', 'de', pack)).toBe('Desc_DoesNotExist_C')
    // パックから該当エントリだけ抜いた場合は en の名前になる
    const withoutPlate: Record<string, string> = { ...pack }
    delete withoutPlate.Desc_IronPlate_C
    expect(resolveDisplayName('Desc_IronPlate_C', 'de', withoutPlate)).toBe('Iron Plate')
  })

  it('ja / en はパックを取りに行かない（バンドル済みの名前を使う）', async () => {
    expect(await loadGameNamePack('ja')).toBeUndefined()
    expect(await loadGameNamePack('en')).toBeUndefined()
    expect(resolveDisplayName('Desc_IronPlate_C', 'ja')).toBe('鉄板')
    expect(resolveDisplayName('Desc_IronPlate_C', 'en')).toBe('Iron Plate')
  })
})
