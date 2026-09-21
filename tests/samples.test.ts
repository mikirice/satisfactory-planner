/**
 * サンプルプラン（src/plan/samples.ts）の検証。
 *
 * サンプルは「初見の人が最初に押すボタン」なので、押した結果が実行不能だと最悪の第一印象になる。
 * ゲームデータ更新でアイテム/レシピIDが消えたらここで落ちるように、
 *  1. スキーマとして警告ゼロで復元できる（＝IDが全部実在する）
 *  2. 実際に解が出て、目標レートを満たす
 *  3. 有効にした代替レシピが**全部その解で使われている**（説明と中身が食い違わない）
 * まで固定する。
 */
import { describe, expect, it } from 'vitest'

import { generatorsById, itemsById, recipes, recipesById } from '../src/data/index.ts'
import { buildPlanGraph } from '../src/plan/graph.ts'
import { getLoopBaseline, loopBaselineSample } from '../src/plan/loop-baseline.ts'
import { SAMPLE_PLANS, TEMPLATE_CATEGORIES } from '../src/plan/samples.ts'
import { PLAN_SCHEMA_VERSION, parsePlanSnapshot } from '../src/plan/serialize.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { Solution, SolveInput } from '../src/solver/index.ts'

const baseRecipeIds = recipes.filter((r) => !r.isAlternate).map((r) => r.id)

async function solveSample(sample: (typeof SAMPLE_PLANS)[number]): Promise<Solution> {
  const parsed = parsePlanSnapshot(sample.snapshot)
  if (!parsed.ok) throw new Error(parsed.error)
  const { input } = parsed
  const fuels = Object.fromEntries(
    Object.entries(input.enabledFuels).map(([generator, selected]) => [
      generator,
      Object.keys(selected),
    ]),
  )
  const solveInput: SolveInput = {
    targets: input.targets.map((t) => ({ item: t.item, ratePerMin: t.ratePerMin })),
    enabledRecipes: [...baseRecipeIds, ...Object.keys(input.enabledAlternates)],
    resourceLimits: input.limitOverrides,
    inputs: Object.fromEntries(input.inputs.map((i) => [i.item, i.ratePerMin])),
    weights: { resources: 1, power: 0, buildings: 0 },
    maxClock: input.maxClock,
    somersloops: input.somersloops,
    power: {
      generators: Object.keys(input.enabledGenerators),
      fuels,
      targetMW: input.powerTargetMW,
      coverFactoryPower: input.coverFactoryPower,
      zeroSurplusByproducts: Object.keys(input.zeroSurplusByproducts),
    },
  }
  const result = await solveProduction(solveInput)
  if (result.status !== 'optimal') throw new Error(`実行不能: ${result.message}`)
  return result
}

function hasDirectedCycle(solution: Solution): boolean {
  const graph = buildPlanGraph(solution)
  const targets = new Map<string, string[]>()
  for (const edge of graph.edges) {
    const next = targets.get(edge.source) ?? []
    next.push(edge.target)
    targets.set(edge.source, next)
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true
    if (visited.has(node)) return false
    visiting.add(node)
    for (const target of targets.get(node) ?? []) if (visit(target)) return true
    visiting.delete(node)
    visited.add(node)
    return false
  }
  return graph.nodes.some((node) => visit(node.id))
}

describe('サンプルプランのスキーマ', () => {
  it('13種類あり、IDと名前が重複せず、すべて有効なカテゴリに属する', () => {
    expect(SAMPLE_PLANS).toHaveLength(13)
    expect(new Set(SAMPLE_PLANS.map((s) => s.id)).size).toBe(SAMPLE_PLANS.length)
    expect(new Set(SAMPLE_PLANS.map((s) => s.title)).size).toBe(SAMPLE_PLANS.length)
    const categories = new Set(TEMPLATE_CATEGORIES.map((c) => c.id))
    expect(SAMPLE_PLANS.every((sample) => categories.has(sample.category))).toBe(true)
    expect(TEMPLATE_CATEGORIES.every((c) => SAMPLE_PLANS.some((s) => s.category === c.id))).toBe(
      true,
    )
    expect(TEMPLATE_CATEGORIES.map((category) => category.id)).toEqual(['basic', 'special', 'power'])
    expect(SAMPLE_PLANS.filter((sample) => sample.category === 'basic')).toHaveLength(3)
    expect(SAMPLE_PLANS.filter((sample) => sample.category === 'special')).toHaveLength(4)
    expect(SAMPLE_PLANS.filter((sample) => sample.category === 'power')).toHaveLength(6)
    expect(SAMPLE_PLANS.filter((sample) => sample.category !== 'basic').every((s) => s.highlight))
      .toBe(true)
  })

  it('ループカテゴリは循環（hasCycle）を持つものだけ、発電カテゴリは循環を持たない', () => {
    expect(
      SAMPLE_PLANS.filter((sample) => sample.category === 'special').map((sample) => sample.id),
    ).toEqual(['oil-loop-complete', 'aluminum-water-loop', 'packaged-diluted-fuel-loop', 'battery-water-loop'])
    expect(SAMPLE_PLANS.filter((sample) => sample.category === 'special').every((s) => s.hasCycle))
      .toBe(true)
    expect(
      SAMPLE_PLANS.filter((sample) => sample.category === 'power').map((sample) => sample.id),
    ).toEqual([
      'diluted-fuel-power',
      'turbofuel-power',
      'nuclear-uranium',
      'nuclear-plutonium',
      'nuclear-reprocessing',
      'nuclear-simplified',
    ])
    expect(SAMPLE_PLANS.filter((sample) => sample.category === 'power').some((s) => s.hasCycle))
      .toBe(false)
  })

  it('10個の特殊テンプレートすべてに構造化された解説がある', () => {
    const special = SAMPLE_PLANS.filter((sample) => sample.category !== 'basic')
    expect(special).toHaveLength(10)
    for (const sample of special) {
      expect(sample.guide?.sections.mechanism.length).toBeGreaterThanOrEqual(3)
      expect(sample.guide?.sections.mechanism.length).toBeLessThanOrEqual(6)
      expect(sample.guide?.sections.tips.length).toBeGreaterThanOrEqual(2)
      expect(sample.guide?.sections.tips.length).toBeLessThanOrEqual(4)
    }
  })

  it.each(SAMPLE_PLANS)('$id: 警告ゼロで復元できる', (sample) => {
    expect(sample.snapshot.v).toBe(PLAN_SCHEMA_VERSION)
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(`復元に失敗: ${parsed.error}`)
    // 警告が出る = 存在しないID等を含んでいる（データ更新で消えたことに気付くための砦）
    expect(parsed.warnings).toEqual([])
    expect(parsed.input.targets.length > 0 || parsed.input.powerTargetMW > 0).toBe(true)
    expect(parsed.input.planName).toBe(sample.title)
  })

  it('原子力の段階テンプレートは ①→②→③ の順で並び、簡略版の前に置かれる', () => {
    const specialIds = SAMPLE_PLANS.filter((s) => s.category === 'power').map((s) => s.id)
    const start = specialIds.indexOf('nuclear-uranium')
    expect(start).toBeGreaterThan(-1)
    expect(specialIds.slice(start, start + 4)).toEqual([
      'nuclear-uranium',
      'nuclear-plutonium',
      'nuclear-reprocessing',
      'nuclear-simplified',
    ])
  })

  it.each(SAMPLE_PLANS)('$id: 比較の基準テンプレートは実在し、自分自身ではない', (sample) => {
    const baseline = loopBaselineSample(sample)
    if (sample.baselineId === undefined) {
      expect(baseline).toBeUndefined()
      return
    }
    expect(baseline?.id).toBe(sample.baselineId)
    expect(baseline?.id).not.toBe(sample.id)
    expect(baseline?.category).toBe(sample.category)
  })

  it.each(SAMPLE_PLANS)('$id: 目標・代替レシピ・アイコンのIDが実在する', (sample) => {
    expect(itemsById.has(sample.icon)).toBe(true)
    for (const [item, rate] of sample.snapshot.t) {
      expect(itemsById.has(item)).toBe(true)
      expect(rate).toBeGreaterThan(0)
    }
    for (const id of sample.snapshot.a) {
      expect(recipesById.get(id)?.isAlternate).toBe(true)
    }
    for (const generator of sample.snapshot.g ?? []) {
      expect(generatorsById.has(generator)).toBe(true)
      // v6 の既定未選択 semantics: 有効な方式には選択燃料を明記する。
      expect(sample.snapshot.u).toHaveProperty(generator)
      expect(sample.snapshot.u?.[generator]?.length).toBeGreaterThan(0)
    }
    expect(sample.description.length).toBeGreaterThan(0)
  })
})

describe('サンプルプランの求解', () => {
  it.each(SAMPLE_PLANS)('$id: 最適解が出て目標レートを満たす', async (sample) => {
    const result = await solveSample(sample)
    for (const target of result.targets) {
      expect(target.producedPerMin).toBeGreaterThanOrEqual(target.requestedPerMin - 1e-6)
    }
    expect(result.steps.length).toBeGreaterThan(0)
    if ((sample.snapshot.w ?? 0) > 0) {
      expect(result.powerGeneration?.totalMW).toBeGreaterThanOrEqual(sample.snapshot.w! - 1e-6)
    } else {
      expect(result.totalPowerMW).toBeGreaterThan(0)
    }
  })

  it.each(SAMPLE_PLANS)('$id: 有効にした代替レシピは全部その解で使われる', async (sample) => {
    const parsed = parsePlanSnapshot(sample.snapshot)
    if (!parsed.ok) throw new Error(parsed.error)
    const enabled = Object.keys(parsed.input.enabledAlternates)

    const result = await solveSample(sample)

    const used = new Set(result.steps.map((s) => s.recipeId))
    expect(enabled.filter((id) => !used.has(id))).toEqual([])
  })

  it.each(SAMPLE_PLANS.filter((sample) => sample.hasCycle))(
    '$id: フローチャートに有向循環がある',
    async (sample) => {
      expect(hasDirectedCycle(await solveSample(sample))).toBe(true)
    },
  )

  it('アルミ精錬は副産物の水を上流工程で再利用する', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'aluminum-water-loop')!
    const solution = await solveSample(sample)
    const water = solution.itemBalance.find((balance) => balance.item === 'Desc_Water_C')!
    expect(water.producedPerMin).toBeGreaterThan(0)
    expect(water.consumedPerMin).toBeGreaterThan(water.producedPerMin)
  })

  it('容器ループは空の容器を回収し、有効な代替レシピをすべて使う', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'packaged-diluted-fuel-loop')!
    const solution = await solveSample(sample)
    const used = new Set(solution.steps.map((step) => step.recipeId))
    expect(used).toContain('Recipe_PackagedWater_C')
    expect(used).toContain('Recipe_UnpackageFuel_C')
    const canister = solution.itemBalance.find((balance) => balance.item === 'Desc_FluidCanister_C')!
    expect(canister.producedPerMin).toBeGreaterThan(0)
    expect(canister.consumedPerMin).toBeGreaterThan(0)
  })

  it('バッテリーループは副産物の水をアルミナ溶液で再利用する', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'battery-water-loop')!
    const solution = await solveSample(sample)
    const water = solution.itemBalance.find((balance) => balance.item === 'Desc_Water_C')!
    expect(water.producedPerMin).toBeGreaterThan(0)
    expect(water.consumedPerMin).toBeGreaterThan(water.producedPerMin)
  })

  /**
   * 原子力の3段階テンプレート。段の違いは「燃料の一覧」と「残さない」の2設定だけで、
   * ① ウランで止める → ② プルトニウムまで再処理 → ③ FICSONIUMで完全循環 と進む。
   * 解説文に書いた筋（どの燃料棒を燃やし、どの廃棄物が残るか）をソルバーの実出力で固定する。
   * 目標発電量はどの段も 5,000 MW。
   */
  describe('原子力の段階テンプレート', () => {
    const URANIUM_ORE = 'Desc_OreUranium_C'
    const URANIUM_ROD = 'Desc_NuclearFuelRod_C'
    const PLUTONIUM_ROD = 'Desc_PlutoniumFuelRod_C'
    const FICSONIUM_ROD = 'Desc_FicsoniumFuelRod_C'
    const URANIUM_WASTE = 'Desc_NuclearWaste_C'
    const PLUTONIUM_WASTE = 'Desc_PlutoniumWaste_C'
    const sampleOf = (id: string) => SAMPLE_PLANS.find((s) => s.id === id)!
    const fuelsBurned = (solution: Solution) =>
      solution.powerGeneration!.fuelUsage.filter((fuel) => fuel.ratePerMin > 1e-9).map((fuel) => fuel.item)
    const surplusOf = (solution: Solution, item: string) =>
      solution.byproducts.find((entry) => entry.item === item)?.ratePerMin ?? 0
    const uraniumOre = (solution: Solution) =>
      solution.rawResources.find((raw) => raw.item === URANIUM_ORE)?.ratePerMin ?? 0

    it('3段とも発電計画は 5,000 MW・原子力発電所のみ・原料上限の設定が同じ', () => {
      const stages = ['nuclear-uranium', 'nuclear-plutonium', 'nuclear-reprocessing'].map(sampleOf)
      for (const stage of stages) {
        expect(stage.snapshot.w).toBe(5000)
        expect(stage.snapshot.g).toEqual(['Build_GeneratorNuclear_C'])
        expect(stage.snapshot.t).toEqual([])
        expect(stage.snapshot.a).toEqual([])
        expect(stage.snapshot.l).toEqual(stages[0]!.snapshot.l)
      }
      // 段の違いは燃料の一覧と「残さない」だけ
      expect(stages[0]!.snapshot.u).toEqual({ Build_GeneratorNuclear_C: [URANIUM_ROD] })
      expect(stages[0]!.snapshot.z).toBeUndefined()
      expect(stages[1]!.snapshot.u).toEqual({ Build_GeneratorNuclear_C: [URANIUM_ROD, PLUTONIUM_ROD] })
      expect(stages[1]!.snapshot.z).toEqual([URANIUM_WASTE])
      expect(stages[2]!.snapshot.u).toEqual({
        Build_GeneratorNuclear_C: [URANIUM_ROD, PLUTONIUM_ROD, FICSONIUM_ROD],
      })
      expect(stages[2]!.snapshot.z).toEqual([URANIUM_WASTE, PLUTONIUM_WASTE])
      // ②③ は ① を比較の基準にする
      expect(stages[1]!.baselineId).toBe('nuclear-uranium')
      expect(stages[2]!.baselineId).toBe('nuclear-uranium')
      expect(stages[0]!.baselineId).toBeUndefined()
    })

    it('①: ウラン燃料棒だけを燃やし、ウラン廃棄物が残る（ウランを採掘する）', async () => {
      const solution = await solveSample(sampleOf('nuclear-uranium'))
      expect(solution.powerGeneration!.totalMW).toBeGreaterThanOrEqual(5000 - 1e-6)
      expect(fuelsBurned(solution)).toEqual([URANIUM_ROD])
      expect(surplusOf(solution, URANIUM_WASTE)).toBeGreaterThan(0)
      expect(surplusOf(solution, PLUTONIUM_WASTE)).toBe(0)
      // 変換機でウランを作らず、採掘したウランを使う
      expect(uraniumOre(solution)).toBeGreaterThan(0)
      expect(solution.steps.some((step) => step.recipeId === 'Recipe_Uranium_Bauxite_C')).toBe(false)
      // 回帰値（2,500 MW/基 × 2 基、燃料棒 0.4/min → ウラン 40/min、廃棄物 20/min）
      expect(solution.powerGeneration!.totalGeneratorCount).toBe(2)
      expect(uraniumOre(solution)).toBeCloseTo(40, 6)
      expect(surplusOf(solution, URANIUM_WASTE)).toBeCloseTo(20, 6)
    })

    it('②: ウランとプルトニウムの燃料棒を燃やし、ウラン廃棄物は残らず、プルトニウム廃棄物が残る', async () => {
      const solution = await solveSample(sampleOf('nuclear-plutonium'))
      expect(solution.powerGeneration!.totalMW).toBeGreaterThanOrEqual(5000 - 1e-6)
      expect(fuelsBurned(solution).sort()).toEqual([PLUTONIUM_ROD, URANIUM_ROD].sort())
      expect(surplusOf(solution, URANIUM_WASTE)).toBe(0)
      expect(surplusOf(solution, PLUTONIUM_WASTE)).toBeGreaterThan(0)
      const used = new Set(solution.steps.map((step) => step.recipeId))
      expect(used).toContain('Recipe_NonFissileUranium_C')
      expect(used).toContain('Recipe_Plutonium_C')
      expect(used).toContain('Recipe_PlutoniumCell_C')
      expect(used).toContain('Recipe_PlutoniumFuelRod_C')
      expect(used).not.toContain('Recipe_Ficsonium_C')
      // ① より少ないウランで同じ 5,000 MW
      const stage1 = await solveSample(sampleOf('nuclear-uranium'))
      expect(uraniumOre(solution)).toBeLessThan(uraniumOre(stage1))
      // 回帰値
      expect(solution.powerGeneration!.totalGeneratorCount).toBe(3)
      expect(uraniumOre(solution)).toBeCloseTo(26.666666666666668, 6)
      expect(surplusOf(solution, PLUTONIUM_WASTE)).toBeCloseTo(0.6666666666666666, 6)
    })

    it('③: 3種類の燃料棒を燃やし、核廃棄物もFICSONIUM燃料棒も残らない', async () => {
      const solution = await solveSample(sampleOf('nuclear-reprocessing'))
      expect(solution.powerGeneration!.totalMW).toBeGreaterThanOrEqual(5000 - 1e-6)
      expect(fuelsBurned(solution).sort()).toEqual([FICSONIUM_ROD, PLUTONIUM_ROD, URANIUM_ROD].sort())
      expect(surplusOf(solution, URANIUM_WASTE)).toBe(0)
      expect(surplusOf(solution, PLUTONIUM_WASTE)).toBe(0)
      expect(surplusOf(solution, FICSONIUM_ROD)).toBe(0)
      expect(surplusOf(solution, 'Desc_Ficsonium_C')).toBe(0)
      const used = new Set(solution.steps.map((step) => step.recipeId))
      expect(used).toContain('Recipe_Plutonium_C')
      expect(used).toContain('Recipe_PlutoniumFuelRod_C')
      expect(used).toContain('Recipe_Ficsonium_C')
      expect(used).toContain('Recipe_FicsoniumFuelRod_C')
      // ① より少ないウランで同じ 5,000 MW
      const stage1 = await solveSample(sampleOf('nuclear-uranium'))
      expect(uraniumOre(solution)).toBeLessThan(uraniumOre(stage1))
      // 回帰値
      expect(solution.powerGeneration!.totalGeneratorCount).toBe(4)
      expect(uraniumOre(solution)).toBeCloseTo(22.857142857142858, 6)
    })

    it('②③ の比較の基準は ① をそのままの設定で解いた結果', async () => {
      const stage1 = await solveSample(sampleOf('nuclear-uranium'))
      for (const id of ['nuclear-plutonium', 'nuclear-reprocessing']) {
        const baseline = await getLoopBaseline(sampleOf(id))
        if (baseline.status !== 'optimal') throw new Error(`比較が実行不能: ${baseline.message}`)
        expect(fuelsBurned(baseline)).toEqual([URANIUM_ROD])
        expect(uraniumOre(baseline)).toBeCloseTo(uraniumOre(stage1), 9)
        expect(surplusOf(baseline, URANIUM_WASTE)).toBeCloseTo(surplusOf(stage1, URANIUM_WASTE), 9)
        expect(baseline.powerGeneration!.totalGeneratorCount).toBe(2)
      }
    })
  })

  /**
   * 簡略版の原子力テンプレートは「代替レシピで工程が減る」という主張そのものが売りなので、
   * 解説に書いた比較（硫酸なし・混合機と精製機なし・工程数と建物種類が減る・ウランが減る）を
   * ソルバーの実出力で固定する。数字を手書きで盛れないようにするための砦。
   */
  describe('原子力発電（代替レシピで簡略化）', () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'nuclear-simplified')!
    const manufacturing = (solution: Solution) =>
      solution.steps.filter((step) => step.powerProductionMW === undefined)

    it('硫酸を使わず、混合機も精製機も現れない', async () => {
      const solution = await solveSample(sample)
      const buildings = new Set(manufacturing(solution).map((step) => step.buildingId))
      expect(buildings.has('Build_Blender_C')).toBe(false)
      expect(buildings.has('Build_OilRefinery_C')).toBe(false)
      expect(solution.itemBalance.some((b) => b.item === 'Desc_SulfuricAcid_C')).toBe(false)
    })

    it('代替レシピなしの構成と比べて工程数・建物の種類・ウラン消費が減る', async () => {
      const solution = await solveSample(sample)
      const baseline = await getLoopBaseline(sample)
      if (baseline.status !== 'optimal') throw new Error(`比較が実行不能: ${baseline.message}`)

      // 比較対象（代替レシピなし）は硫酸を混合機と精製機で扱う構成になる
      const baselineBuildings = new Set(manufacturing(baseline).map((step) => step.buildingId))
      expect(baselineBuildings.has('Build_Blender_C')).toBe(true)
      expect(baselineBuildings.has('Build_OilRefinery_C')).toBe(true)

      const currentBuildings = new Set(manufacturing(solution).map((step) => step.buildingId))
      expect(currentBuildings.size).toBeLessThan(baselineBuildings.size)
      expect(manufacturing(solution).length).toBeLessThan(manufacturing(baseline).length)

      const uranium = (result: Solution): number =>
        result.rawResources.find((raw) => raw.item === 'Desc_OreUranium_C')?.ratePerMin ?? 0
      expect(uranium(solution)).toBeGreaterThan(0)
      expect(uranium(solution)).toBeLessThan(uranium(baseline))
    })

    it('流体は発電所の冷却水だけで、ウラン廃棄物はシンクに流せない', async () => {
      const solution = await solveSample(sample)
      const fluids = solution.itemBalance.filter(
        (balance) => itemsById.get(balance.item)?.form !== 'solid',
      )
      expect(fluids.map((balance) => balance.item)).toEqual(['Desc_Water_C'])
      // 水を消費するのは発電機だけ（製造側に配管が要らないことの担保）
      const waterUsers = solution.steps.filter((step) =>
        step.inputs.some((input) => input.item === 'Desc_Water_C'),
      )
      expect(waterUsers.every((step) => step.powerProductionMW !== undefined)).toBe(true)

      const waste = solution.byproducts.find((b) => b.item === 'Desc_NuclearWaste_C')
      expect(waste?.ratePerMin).toBeGreaterThan(0)
      expect(itemsById.get('Desc_NuclearWaste_C')?.sinkPoints).toBe(0)
    })
  })

  it('リサイクルの例は代替レシピを切ると原油の消費が跳ね上がる（見せ場が成立している）', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'recycled-plastic')!
    const targets = sample.snapshot.t.map(([item, ratePerMin]) => ({ item, ratePerMin }))
    const weights = { resources: 1, power: 0, buildings: 0 }

    const withAlts = await solveProduction({
      targets,
      enabledRecipes: [...baseRecipeIds, ...sample.snapshot.a],
      weights,
    })
    const withoutAlts = await solveProduction({ targets, enabledRecipes: baseRecipeIds, weights })
    if (withAlts.status !== 'optimal' || withoutAlts.status !== 'optimal') {
      throw new Error('サンプルが実行不能')
    }

    const oil = (r: Solution): number =>
      r.rawResources.find((x) => x.item === 'Desc_LiquidOil_C')?.ratePerMin ?? 0
    expect(oil(withoutAlts)).toBeGreaterThan(oil(withAlts) * 2)
  })

  it('石油ループ完全版はループなしの比較より原油を節約する', async () => {
    const sample = SAMPLE_PLANS.find((s) => s.id === 'oil-loop-complete')!
    const withLoop = await solveSample(sample)
    const baseline = await getLoopBaseline(sample)
    if (baseline.status !== 'optimal') throw new Error(`比較が実行不能: ${baseline.message}`)

    const crude = (result: Solution): number =>
      result.rawResources.find((raw) => raw.item === 'Desc_LiquidOil_C')?.ratePerMin ?? 0
    expect(crude(withLoop)).toBeLessThan(crude(baseline))
  })
})
