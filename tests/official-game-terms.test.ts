import { describe, expect, it } from 'vitest'

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

describe('公式ゲーム用語', () => {
  it.each(UNOFFICIAL_BUILDING_ALIASES)('手書きUI文言に非公式別名「%s」がない', (alias) => {
    expect(uiTextStrings.filter((text) => text.includes(alias)), 'src/ui/text.ts').toEqual([])
    expect(
      sampleTextStrings.filter((text) => text.includes(alias)),
      'src/plan/samples.ts',
    ).toEqual([])
  })
})
