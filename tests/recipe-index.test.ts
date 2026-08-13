import { describe, expect, it } from 'vitest'

import { itemsById, recipesById } from '../src/data/index.ts'
import { getRecipesForItem, recipeMetrics } from '../src/plan/recipe-index.ts'

const IRON_PLATE = 'Desc_IronPlate_C'

describe('アイテム別レシピ索引', () => {
  it('鉄板の通常・代替レシピを漏れなく、比較用の順序で返す', () => {
    expect(itemsById.get(IRON_PLATE)?.name.ja).toBe('鉄板')

    const index = getRecipesForItem(IRON_PLATE)
    expect(index.producing.map((recipe) => recipe.id)).toEqual([
      'Recipe_IronPlate_C',
      'Recipe_Alternate_CoatedIronPlate_C',
      'Recipe_Alternate_SteelCastedPlate_C',
    ])
    expect(
      index.producing.map((recipe) => recipeMetrics(recipe, IRON_PLATE).outputRatePerMin),
    ).toEqual([20, 75, 45])
  })

  it('鉄板を材料にするレシピを返す', () => {
    const consumingIds = getRecipesForItem(IRON_PLATE).consuming.map((recipe) => recipe.id)

    expect(consumingIds.length).toBeGreaterThan(0)
    expect(consumingIds).toContain('Recipe_IronPlateReinforced_C')
    expect(consumingIds).toContain('Recipe_NitricAcid_C')
    for (const recipe of getRecipesForItem(IRON_PLATE).consuming) {
      expect(recipe.ingredients.some((ingredient) => ingredient.item === IRON_PLATE)).toBe(true)
    }
  })

  it('生産レシピのない原料と不明なIDも安全に引ける', () => {
    const bluePowerSlug = getRecipesForItem('Desc_Crystal_C')
    expect(bluePowerSlug.producing).toEqual([])
    expect(bluePowerSlug.consuming.length).toBeGreaterThan(0)

    expect(getRecipesForItem('Desc_NotFound_C')).toEqual({ producing: [], consuming: [] })
  })
})

describe('レシピ比較指標', () => {
  it('鉄板: 2個/6秒、鉄インゴット3個/6秒、製作機4MWを正しく換算する', () => {
    const recipe = recipesById.get('Recipe_IronPlate_C')!
    const metrics = recipeMetrics(recipe, IRON_PLATE)

    expect(metrics.outputRatePerMin).toBe(20)
    expect(metrics.powerConsumptionMW).toBe(4)
    expect(metrics.powerRangeMW).toBeUndefined()
    expect(metrics.outputPerMW).toBe(5)
    expect(metrics.ingredients).toEqual([
      {
        item: 'Desc_IronIngot_C',
        amount: 3,
        ratePerMin: 30,
        outputPerIngredient: 2 / 3,
      },
    ])
    expect(metrics.products).toEqual([{ item: IRON_PLATE, amount: 2, ratePerMin: 20 }])
  })

  it('対象アイテムを産出しないレシピは比較指標を作らない', () => {
    const recipe = recipesById.get('Recipe_IronPlate_C')!
    expect(() => recipeMetrics(recipe, 'Desc_CopperSheet_C')).toThrow(
      'does not produce item Desc_CopperSheet_C',
    )
  })
})
