import { describe, expect, it } from 'vitest'

import {
  decodeDocs,
  num,
  parseItemAmounts,
  parseProducedIn,
  shortNativeClass,
} from '../scripts/docs-parse.ts'

const SAMPLE = '[{"NativeClass":"あ"}]'

describe('decodeDocs（エンコーディング自動判定）', () => {
  it('UTF-16LE + BOM を読める（実物の Docs.json の形式）', () => {
    const body = Buffer.from(SAMPLE, 'utf16le')
    const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), body])
    expect(decodeDocs(buf)).toBe(SAMPLE)
  })

  it('BOM 無しの UTF-16LE も NUL バイトから判定できる', () => {
    expect(decodeDocs(Buffer.from(SAMPLE, 'utf16le'))).toBe(SAMPLE)
  })

  it('UTF-16BE + BOM を読める', () => {
    const body = Buffer.from(SAMPLE, 'utf16le')
    body.swap16()
    const buf = Buffer.concat([Buffer.from([0xfe, 0xff]), body])
    expect(decodeDocs(buf)).toBe(SAMPLE)
  })

  it('UTF-8 (BOM あり / なし) を読める', () => {
    expect(decodeDocs(Buffer.from(SAMPLE, 'utf8'))).toBe(SAMPLE)
    const withBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(SAMPLE, 'utf8')])
    expect(decodeDocs(withBom)).toBe(SAMPLE)
  })
})

describe('Unreal 文字列のパース', () => {
  it('mIngredients / mProduct を ClassName と Amount に分解する', () => {
    const raw =
      '((ItemClass="/Script/Engine.BlueprintGeneratedClass\'/Game/FactoryGame/Resource/Parts/IronIngot/Desc_IronIngot.Desc_IronIngot_C\'",Amount=3),' +
      '(ItemClass="/Script/Engine.BlueprintGeneratedClass\'/Game/FactoryGame/Resource/RawResources/Water/Desc_Water.Desc_Water_C\'",Amount=1500))'
    expect(parseItemAmounts(raw)).toEqual([
      { classNameId: 'Desc_IronIngot_C', amount: 3 },
      { classNameId: 'Desc_Water_C', amount: 1500 },
    ])
  })

  it('空文字・undefined は空配列', () => {
    expect(parseItemAmounts('')).toEqual([])
    expect(parseItemAmounts(undefined)).toEqual([])
  })

  it('mProducedIn から Build_*_C を抽出し、Script 参照は含まない', () => {
    const raw =
      '("/Game/FactoryGame/Buildable/Factory/ConstructorMk1/Build_ConstructorMk1.Build_ConstructorMk1_C","/Script/FactoryGame.FGBuildableAutomatedWorkBench")'
    expect(parseProducedIn(raw)).toEqual(['Build_ConstructorMk1_C'])
  })

  it('NativeClass を短縮できる', () => {
    expect(shortNativeClass("/Script/CoreUObject.Class'/Script/FactoryGame.FGRecipe'")).toBe('FGRecipe')
  })

  it('num は空文字・不正値を fallback にする', () => {
    expect(num('1.5')).toBe(1.5)
    expect(num('', 7)).toBe(7)
    expect(num(undefined, 7)).toBe(7)
    expect(num('abc', 7)).toBe(7)
  })
})
