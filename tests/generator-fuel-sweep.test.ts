/**
 * 発電機 × 燃料の総当たり回帰。
 *
 * データに燃料を追加したら自動的にケースも増える。全レシピを有効にした条件で、
 * 解けるか、ゲーム上避けられない理由を名指しして実行不能になることを保証する。
 */
import { describe, expect, it } from 'vitest'

import { generators, itemsById, recipes, recipesById } from '../src/data/index.ts'
import { solveProduction } from '../src/solver/index.ts'

type AllowedFailure = {
  item: string
  messageIncludes: readonly string[]
}

const pairKey = (generatorId: string, fuelItem: string): string => `${generatorId}::${fuelItem}`

const ALLOWED_FAILURES: Readonly<Record<string, AllowedFailure>> = {
  [pairKey('Build_GeneratorFuel_C', 'Desc_LiquidBiofuel_C')]: {
    item: 'Desc_LiquidBiofuel_C',
    messageIncludes: ['液体バイオ燃料', '固体バイオ燃料', '自動化レシピ', '既にあるアイテム'],
  },
  [pairKey('Build_GeneratorNuclear_C', 'Desc_FicsoniumFuelRod_C')]: {
    item: 'Desc_FicsoniumFuelRod_C',
    messageIncludes: [
      'FICSONIUM燃料棒',
      'ウラン廃棄物',
      'プルトニウム廃棄物',
      'ウラン燃料棒',
      'プルトニウム燃料棒',
      '副産物',
    ],
  },
  [pairKey('Build_GeneratorNuclear_C', 'Desc_PlutoniumFuelRod_C')]: {
    item: 'Desc_PlutoniumFuelRod_C',
    messageIncludes: ['プルトニウム燃料棒', 'ウラン廃棄物', 'ウラン燃料棒', '副産物'],
  },
}

const ALL_RECIPE_IDS = recipes.map((recipe) => recipe.id)
const CASES = generators.flatMap((generator) =>
  generator.fuels.map((fuel) => ({
    key: pairKey(generator.id, fuel.item),
    label: `${generator.name.ja} × ${itemsById.get(fuel.item)!.name.ja}`,
    generator,
    fuel,
  })),
)

describe('発電機 × 燃料の総当たり', () => {
  it('例外許可リストに、現在の発電機・燃料に存在しない古い項目を残さない', () => {
    const keys = new Set(CASES.map((entry) => entry.key))
    for (const key of Object.keys(ALLOWED_FAILURES)) expect(keys.has(key), key).toBe(true)
  })

  it.each(CASES)('$label', async ({ key, generator, fuel }) => {
    const result = await solveProduction({
      targets: [],
      enabledRecipes: ALL_RECIPE_IDS,
      power: {
        generators: [generator.id],
        fuels: { [generator.id]: [fuel.item] },
        targetMW: generator.powerProductionMW,
      },
    })
    const allowedFailure = ALLOWED_FAILURES[key]

    if (result.status === 'optimal') {
      expect(allowedFailure, `${key} は解けるため例外許可リストから削除してください`).toBeUndefined()
      expect(result.powerGeneration!.totalMW).toBeGreaterThanOrEqual(
        generator.powerProductionMW - 1e-6,
      )
      expect(result.powerGeneration!.totalGeneratorMachineCount).toBeCloseTo(1, 6)
      expect(result.powerGeneration!.fuelUsage.map((entry) => entry.item)).toEqual([fuel.item])
      const generatorSteps = result.steps.filter((step) => step.fuelItem !== undefined)
      expect(generatorSteps).toHaveLength(1)
      expect(generatorSteps[0].buildingId).toBe(generator.id)
      expect(generatorSteps[0].fuelItem).toBe(fuel.item)

      if (fuel.item === 'Desc_IonizedFuel_C') {
        const recipeIds = new Set(result.steps.map((step) => step.recipeId))
        for (const recipeId of [
          'Recipe_IonizedFuel_C',
          'Recipe_RocketFuel_C',
          'Recipe_NitricAcid_C',
          'Recipe_SyntheticPowerShard_C',
          'Recipe_TimeCrystal_C',
          'Recipe_QuantumEnergy_C',
        ]) {
          expect(recipeIds.has(recipeId), recipeId).toBe(true)
        }
        expect(
          [
            'Recipe_DarkMatter_C',
            'Recipe_Alternate_DarkMatter_Crystallization_C',
            'Recipe_Alternate_DarkMatter_Trap_C',
          ].some((recipeId) => recipeIds.has(recipeId)),
          'dark matter recipe',
        ).toBe(true)
        expect(
          result.steps.find((step) => step.recipeId === 'Recipe_SyntheticPowerShard_C')!.buildingId,
        ).toBe('Build_QuantumEncoder_C')
      }
      return
    }

    expect(allowedFailure, `${key}: ${result.message}`).toBeDefined()
    if (!allowedFailure) return
    expect(result.message).not.toContain('原因を特定できませんでした')
    expect(result.reasons.some((reason) => reason.kind === 'solverError')).toBe(false)
    const reason = result.reasons.find(
      (entry) => entry.kind === 'unproducibleItem' && entry.item === allowedFailure.item,
    )
    expect(reason, `${key}: ${result.message}`).toBeDefined()
    for (const fragment of allowedFailure.messageIncludes) {
      expect(reason!.message, `${key}: ${fragment}`).toContain(fragment)
    }
  })
})

describe('イオン燃料の通常進行チェーン', () => {
  it('合成パワー・シャードは量子エンコーダーの自動化レシピとして収録する', () => {
    const shard = recipesById.get('Recipe_SyntheticPowerShard_C')!
    expect(shard).toBeDefined()
    expect(shard.isAlternate).toBe(false)
    expect(shard.producedIn).toBe('Build_QuantumEncoder_C')
    expect(shard.products.map((product) => product.item)).toContain('Desc_CrystalShard_C')
    expect(shard.products.map((product) => product.item)).toContain('Desc_DarkEnergy_C')
    expect(recipesById.get('Recipe_QuantumEnergy_C')!.ingredients).toEqual([])
  })

  it('代替レシピを選ばなくても、イオン燃料だけで 250 MW を発電できる', async () => {
    const result = await solveProduction({
      targets: [],
      power: {
        generators: ['Build_GeneratorFuel_C'],
        fuels: { Build_GeneratorFuel_C: ['Desc_IonizedFuel_C'] },
        targetMW: 250,
      },
    })
    expect(result.status).toBe('optimal')
    if (result.status !== 'optimal') return
    expect(result.powerGeneration!.totalMW).toBeCloseTo(250, 6)
    expect(result.powerGeneration!.fuelUsage).toEqual([
      { item: 'Desc_IonizedFuel_C', ratePerMin: 3 },
    ])
    const recipeIds = new Set(result.steps.map((step) => step.recipeId))
    for (const recipeId of [
      'Recipe_Alternate_EnrichedCoal_C',
      'Recipe_Alternate_Turbofuel_C',
      'Recipe_RocketFuel_C',
      'Recipe_IonizedFuel_C',
      'Recipe_SyntheticPowerShard_C',
      'Recipe_DarkMatter_C',
      'Recipe_QuantumEnergy_C',
    ]) {
      expect(recipeIds.has(recipeId), recipeId).toBe(true)
    }
  })
})
