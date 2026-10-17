import { describe, expect, it } from 'vitest'

import { handwrittenArticles } from '../content/articles/index.ts'
import { SAMPLE_PLANS } from '../src/plan/samples.ts'
import { T } from '../src/ui/text.ts'

const UNOFFICIAL_BUILDING_ALIASES = [
  'ブレンダー',
  '製油所',
  'スメルター',
  'リファイナリー',
  'アセンブラ',
  'コンストラクタ',
  'マニュファクチャラー',
  'パッケージャー',
  '組立器',
  '製錬所',
] as const

const ARTICLE_BUILDING_ALIASES = ['水抽出機', '採油機', '採掘機', 'ブレンダー'] as const

function collectStringConstants(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStringConstants)
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectStringConstants)
  }
  return []
}

const uiTextStrings = collectStringConstants(T)
const sampleTextStrings = SAMPLE_PLANS.flatMap((sample) =>
  collectStringConstants({
    title: sample.title,
    description: sample.description,
    highlight: sample.highlight,
    guide: sample.guide,
  }),
)
const articleTextStrings = handwrittenArticles.flatMap(collectStringConstants)

describe('公式ゲーム用語', () => {
  it.each(UNOFFICIAL_BUILDING_ALIASES)('手書きUI文言に非公式別名「%s」がない', (alias) => {
    expect(uiTextStrings.filter((text) => text.includes(alias)), 'src/ui/text.ts').toEqual([])
    expect(
      sampleTextStrings.filter((text) => text.includes(alias)),
      'src/plan/samples.ts',
    ).toEqual([])
  })

  it.each(ARTICLE_BUILDING_ALIASES)('日本語記事に非公式な設備名「%s」がない', (alias) => {
    expect(articleTextStrings.filter((text) => text.includes(alias)), 'content/articles/*.ts').toEqual([])
    expect(sampleTextStrings.filter((text) => text.includes(alias)), 'src/plan/samples.ts').toEqual([])
  })
})
