import { describe, expect, it } from 'vitest'

import {
  buildings,
  buildingsById,
  items,
  itemsById,
  meta,
  ratePerMin,
  recipes,
  recipesById,
} from '../src/data/index.ts'
import { CLOCK_MAX, DEFAULT_POWER_EXPONENT } from '../src/data/constants.ts'

describe('スキーマ整合性', () => {
  it('データが空でない', () => {
    expect(items.length).toBeGreaterThan(100)
    expect(recipes.length).toBeGreaterThan(200)
    expect(buildings.length).toBeGreaterThan(10)
    expect(meta.counts).toEqual({
      items: items.length,
      recipes: recipes.length,
      buildings: buildings.length,
    })
  })

  it('ID が一意', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
    expect(new Set(recipes.map((r) => r.id)).size).toBe(recipes.length)
    expect(new Set(buildings.map((b) => b.id)).size).toBe(buildings.length)
  })

  it('アイテムの form / 名前 / シンクポイントが正しい形', () => {
    for (const item of items) {
      expect(['solid', 'liquid', 'gas'], item.id).toContain(item.form)
      expect(item.name.ja.length, item.id).toBeGreaterThan(0)
      expect(item.name.en.length, item.id).toBeGreaterThan(0)
      expect(item.sinkPoints, item.id).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(item.sinkPoints), item.id).toBe(true)
    }
  })

  it('全レシピの ingredients / products が items に解決できる', () => {
    const unresolved: string[] = []
    for (const recipe of recipes) {
      for (const entry of [...recipe.ingredients, ...recipe.products]) {
        if (!itemsById.has(entry.item)) unresolved.push(`${recipe.id} -> ${entry.item}`)
      }
    }
    expect(unresolved).toEqual([])
  })

  it('全レシピの durationSec > 0・産出が1件以上・数量が正の有限値', () => {
    for (const recipe of recipes) {
      expect(recipe.durationSec, recipe.id).toBeGreaterThan(0)
      expect(Number.isFinite(recipe.durationSec), recipe.id).toBe(true)
      expect(recipe.products.length, recipe.id).toBeGreaterThan(0)
      for (const entry of [...recipe.ingredients, ...recipe.products]) {
        expect(entry.amount, `${recipe.id} / ${entry.item}`).toBeGreaterThan(0)
        expect(Number.isFinite(entry.amount), `${recipe.id} / ${entry.item}`).toBe(true)
      }
    }
  })

  it('全レシピの producedIn が buildings に解決でき、生産可能な種別である', () => {
    for (const recipe of recipes) {
      const building = buildingsById.get(recipe.producedIn)
      expect(building, `${recipe.id} -> ${recipe.producedIn}`).toBeDefined()
      expect(['manufacturer', 'extractor', 'generator'], recipe.id).toContain(building!.category)
    }
  })

  it('建物の電力パラメータと建設コストが妥当', () => {
    for (const building of buildings) {
      expect(building.name.ja.length, building.id).toBeGreaterThan(0)
      expect(building.powerConsumptionMW, building.id).toBeGreaterThanOrEqual(0)
      expect(building.powerExponent, building.id).toBeGreaterThan(1)
      expect(building.powerExponent, building.id).toBeLessThan(2)
      expect(building.maxSomersloops, building.id).toBeGreaterThanOrEqual(0)
      for (const cost of building.buildCost) {
        expect(itemsById.has(cost.item), `${building.id} -> ${cost.item}`).toBe(true)
        expect(cost.amount, `${building.id} -> ${cost.item}`).toBeGreaterThan(0)
      }
    }
  })

  it('製造機はすべて建設コストを持つ', () => {
    for (const building of buildings.filter((b) => b.category === 'manufacturer')) {
      expect(building.buildCost.length, building.id).toBeGreaterThan(0)
    }
  })

  it('代替レシピが存在し、命名規則と一致する', () => {
    const alternates = recipes.filter((r) => r.isAlternate)
    expect(alternates.length).toBeGreaterThan(80)
    for (const recipe of alternates) {
      expect(
        recipe.id.startsWith('Recipe_Alternate_') || recipe.name.en.startsWith('Alternate:'),
        recipe.id,
      ).toBe(true)
    }
  })
})

describe('既知の値のスポットチェック', () => {
  it('鉄板レシピ: 鉄インゴット 30/min → 鉄板 20/min（製作機・6秒）', () => {
    const recipe = recipesById.get('Recipe_IronPlate_C')!
    expect(recipe).toBeDefined()
    expect(recipe.producedIn).toBe('Build_ConstructorMk1_C')
    expect(recipe.durationSec).toBe(6)
    expect(recipe.ingredients).toEqual([{ item: 'Desc_IronIngot_C', amount: 3 }])
    expect(recipe.products).toEqual([{ item: 'Desc_IronPlate_C', amount: 2 }])
    expect(ratePerMin(recipe.ingredients[0].amount, recipe.durationSec)).toBe(30)
    expect(ratePerMin(recipe.products[0].amount, recipe.durationSec)).toBe(20)
  })

  it('液体レシピのレートが1000倍になっていない（プラスチック: 原油 30 m³/min）', () => {
    const recipe = recipesById.get('Recipe_Plastic_C')!
    const oil = recipe.ingredients.find((i) => i.item === 'Desc_LiquidOil_C')!
    expect(oil.amount).toBe(3)
    expect(ratePerMin(oil.amount, recipe.durationSec)).toBe(30)
    // 副産物の廃重油も m³ 単位
    const residue = recipe.products.find((p) => p.item === 'Desc_HeavyOilResidue_C')!
    expect(ratePerMin(residue.amount, recipe.durationSec)).toBe(10)
  })

  it('液体・気体の1サイクル量がすべて内部単位(1000倍)ではない', () => {
    const suspicious: string[] = []
    for (const recipe of recipes) {
      for (const entry of [...recipe.ingredients, ...recipe.products]) {
        const item = itemsById.get(entry.item)!
        if (item.form === 'solid') continue
        // 実ゲームの液体レシピは 1サイクル 100 m³ を超えない。
        // 1000倍のままなら必ずここに引っかかる。
        if (entry.amount >= 100) suspicious.push(`${recipe.id} / ${entry.item} = ${entry.amount}`)
      }
    }
    expect(suspicious).toEqual([])
  })

  it('固体アイテムの1サイクル量は整数（1000倍の巻き添えスケールをしていない）', () => {
    for (const recipe of recipes) {
      for (const entry of [...recipe.ingredients, ...recipe.products]) {
        const item = itemsById.get(entry.item)!
        if (item.form !== 'solid') continue
        expect(Number.isInteger(entry.amount), `${recipe.id} / ${entry.item}`).toBe(true)
      }
    }
  })

  it('循環レシピ（リサイクル・プラスチック / ゴム）が存在し相互に依存する', () => {
    const plastic = recipesById.get('Recipe_Alternate_Plastic_1_C')!
    const rubber = recipesById.get('Recipe_Alternate_RecycledRubber_C')!
    expect(plastic, 'リサイクル・プラスチック').toBeDefined()
    expect(rubber, 'リサイクル・ゴム').toBeDefined()

    // プラスチックを作るのにゴムを消費し、ゴムを作るのにプラスチックを消費する
    expect(plastic.products.map((p) => p.item)).toContain('Desc_Plastic_C')
    expect(plastic.ingredients.map((i) => i.item)).toContain('Desc_Rubber_C')
    expect(rubber.products.map((p) => p.item)).toContain('Desc_Rubber_C')
    expect(rubber.ingredients.map((i) => i.item)).toContain('Desc_Plastic_C')

    // 両方とも燃料（液体）を消費する = 液体スケールの検証も兼ねる
    for (const recipe of [plastic, rubber]) {
      const fuel = recipe.ingredients.find((i) => i.item === 'Desc_LiquidFuel_C')!
      expect(fuel, recipe.id).toBeDefined()
      expect(ratePerMin(fuel.amount, recipe.durationSec)).toBe(30)
    }
  })

  it('建物のスポットチェック（製作機 / 製造機 / 製錬炉 / 充填機）', () => {
    const constructor = buildingsById.get('Build_ConstructorMk1_C')!
    expect(constructor.powerConsumptionMW).toBe(4)
    expect(constructor.powerExponent).toBeCloseTo(DEFAULT_POWER_EXPONENT, 4)
    expect(constructor.maxSomersloops).toBe(1)
    expect(constructor.category).toBe('manufacturer')

    expect(buildingsById.get('Build_ManufacturerMk1_C')!.powerConsumptionMW).toBe(55)
    expect(buildingsById.get('Build_ManufacturerMk1_C')!.maxSomersloops).toBe(4)
    // 製錬炉は Docs 上の枠数が 0 だが実ゲームでは 1 枠（build-data 側で補正）
    expect(buildingsById.get('Build_SmelterMk1_C')!.maxSomersloops).toBe(1)
    // 充填機は Somersloop 非対応
    expect(buildingsById.get('Build_Packager_C')!.maxSomersloops).toBe(0)
    // 採掘機は Somersloop 非対応
    expect(buildingsById.get('Build_MinerMk1_C')!.maxSomersloops).toBe(0)
  })

  it('可変電力の建物（粒子加速器）が電力レンジを持つ', () => {
    const collider = buildingsById.get('Build_HadronCollider_C')!
    expect(collider.variablePower).toBeDefined()
    expect(collider.variablePower!.minMW).toBeGreaterThan(0)
    expect(collider.variablePower!.maxMW).toBeGreaterThan(collider.variablePower!.minMW)
  })

  it('定数がゲーム仕様と一致する', () => {
    expect(CLOCK_MAX).toBe(2.5)
    expect(DEFAULT_POWER_EXPONENT).toBeCloseTo(Math.log2(2.5), 5)
  })
})

describe('日本語名', () => {
  it('ja 名が en へフォールバックしていない', () => {
    expect(meta.missingJaNames).toEqual([])
  })

  it('主要アイテム・建物の日本語名が公式訳と一致する', () => {
    expect(itemsById.get('Desc_IronPlate_C')!.name.ja).toBe('鉄板')
    expect(itemsById.get('Desc_IronPlate_C')!.name.en).toBe('Iron Plate')
    expect(itemsById.get('Desc_IronIngot_C')!.name.ja).toBe('鉄のインゴット')
    expect(itemsById.get('Desc_Water_C')!.name.ja).toBe('水')
    expect(itemsById.get('Desc_Plastic_C')!.name.ja).toBe('プラスチック')
    expect(buildingsById.get('Build_ConstructorMk1_C')!.name.ja).toBe('製作機')
    expect(recipesById.get('Recipe_Alternate_Plastic_1_C')!.name.ja).toContain('リサイクル')
  })

  it('大半のアイテムが英語とは異なる日本語名を持つ', () => {
    const translated = items.filter((i) => i.name.ja !== i.name.en)
    expect(translated.length / items.length).toBeGreaterThan(0.9)
  })

  it('液体・気体アイテムが form 通りに分類されている', () => {
    expect(itemsById.get('Desc_Water_C')!.form).toBe('liquid')
    expect(itemsById.get('Desc_LiquidOil_C')!.form).toBe('liquid')
    expect(itemsById.get('Desc_NitrogenGas_C')!.form).toBe('gas')
    expect(itemsById.get('Desc_IronPlate_C')!.form).toBe('solid')
  })
})
