/**
 * 発電機の副産物（核廃棄物）が要るせいで作れないケースの説明。
 *
 * ウラン廃棄物・プルトニウム廃棄物はレシピでは作れず、原子力発電所を回したときの
 * 副産物としてしか出ない。発電計画を有効にしていないと、その先のチェーン
 * （プルトニウム・ペレット / FICSONIUM など）が「レシピ不足」に見えてしまうので、
 * 原因と対処（どの発電機をどの燃料で回すか）を名指しできることを保証する。
 */
import { describe, expect, it } from 'vitest'

import { recipes } from '../src/data/index.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { InfeasibleReason } from '../src/solver/index.ts'

const ALL_RECIPE_IDS = recipes.map((recipe) => recipe.id)

const NUCLEAR = 'Build_GeneratorNuclear_C'
const URANIUM_ROD = 'Desc_NuclearFuelRod_C'
const PLUTONIUM_ROD = 'Desc_PlutoniumFuelRod_C'
const URANIUM_WASTE = 'Desc_NuclearWaste_C'
const PLUTONIUM_WASTE = 'Desc_PlutoniumWaste_C'

async function reasonsFor(item: string, ratePerMin = 10): Promise<InfeasibleReason[]> {
  const result = await solveProduction({
    targets: [{ item, ratePerMin }],
    enabledRecipes: ALL_RECIPE_IDS,
  })
  expect(result.status, `${item} は発電計画なしでは解けないはず`).toBe('infeasible')
  return result.status === 'infeasible' ? result.reasons : []
}

describe('発電機の副産物が要るアイテム', () => {
  it('プルトニウム・ペレットは、ウラン廃棄物の出どころ（原子力発電所×ウラン燃料棒）を名指しする', async () => {
    const reasons = await reasonsFor('Desc_PlutoniumPellet_C')
    expect(reasons).toHaveLength(1)
    const reason = reasons[0]
    expect(reason.kind).toBe('requiresGeneratorByproduct')
    if (reason.kind !== 'requiresGeneratorByproduct') return

    expect(reason.item).toBe('Desc_PlutoniumPellet_C')
    // 要るのはウラン廃棄物だけ（プルトニウム廃棄物は関係ない）
    expect(reason.byproducts).toEqual([URANIUM_WASTE])
    expect(reason.sources).toEqual([
      { generator: NUCLEAR, fuel: URANIUM_ROD, byproduct: URANIUM_WASTE },
    ])
    // ソルバー側の日本語メッセージ（ログ用）にも出どころが載る
    expect(reason.message).toContain('ウラン廃棄物')
    expect(reason.message).toContain('原子力発電所')
    expect(reason.message).toContain('ウラン燃料棒')
  })

  it('発電計画で原子力発電所とウラン燃料棒を許可すれば、プルトニウム・ペレットは作れる', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_PlutoniumPellet_C', ratePerMin: 10 }],
      enabledRecipes: ALL_RECIPE_IDS,
      power: {
        generators: [NUCLEAR],
        fuels: { [NUCLEAR]: [URANIUM_ROD] },
        targetMW: 2500,
      },
    })
    expect(result.status).toBe('optimal')
    if (result.status !== 'optimal') return
    expect(result.targets[0].producedPerMin).toBeGreaterThanOrEqual(10 - 1e-6)
    expect(result.powerGeneration!.fuelUsage.map((entry) => entry.item)).toEqual([URANIUM_ROD])
  })

  it('FICSONIUM は両方の廃棄物と、それぞれの燃料を挙げる', async () => {
    const reasons = await reasonsFor('Desc_Ficsonium_C', 1)
    const reason = reasons[0]
    expect(reason.kind).toBe('requiresGeneratorByproduct')
    if (reason.kind !== 'requiresGeneratorByproduct') return

    expect([...reason.byproducts].sort()).toEqual([URANIUM_WASTE, PLUTONIUM_WASTE].sort())
    expect(reason.sources.map((source) => source.fuel).sort()).toEqual(
      [URANIUM_ROD, PLUTONIUM_ROD].sort(),
    )
    for (const source of reason.sources) expect(source.generator).toBe(NUCLEAR)
  })

  it('廃棄物そのものを目標にしたときは、同じ名前を2回出さない', async () => {
    const reasons = await reasonsFor(URANIUM_WASTE, 1)
    const reason = reasons[0]
    expect(reason.kind).toBe('requiresGeneratorByproduct')
    if (reason.kind !== 'requiresGeneratorByproduct') return

    expect(reason.byproducts).toContain(URANIUM_WASTE)
    expect(reason.message.startsWith('ウラン廃棄物 は、')).toBe(true)
    expect(reason.message).not.toContain('材料の')
  })

  it('発電機とは無関係に作れないアイテムは、従来どおり「レシピ不足」のまま', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: [],
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons.map((reason) => reason.kind)).toEqual(['unproducibleItem'])
  })

  it('原料上限を 0 にして作れなくしたケースも「レシピ不足」のまま', async () => {
    const result = await solveProduction({
      targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
      enabledRecipes: ['Recipe_IngotIron_C', 'Recipe_IronPlate_C'],
      resourceLimits: { Desc_OreIron_C: 0 },
    })
    expect(result.status).toBe('infeasible')
    if (result.status !== 'infeasible') return
    expect(result.reasons.map((reason) => reason.kind)).toEqual(['unproducibleItem'])
  })
})
