/**
 * 製造クロック上限（SolveInput.maxClock）と採掘クロックの検証。
 *
 * 要点:
 * - LP は変わらない（稼働台数はクロック100%換算のまま）。変わるのは
 *   「建てる台数 = ceil(稼働台数 / 上限クロック)」から先の後処理だけ
 * - 消費電力はクロックに対して超線形（c^powerExponent）なので、
 *   上限を上げると台数は減るが電力は増える。ここを数値で固定する
 */
import { describe, expect, it } from 'vitest'

import { buildingsById } from '../src/data/index.ts'
import { CLOCK_MAX } from '../src/data/constants.ts'
import { clockedPowerMW, planExtraction, solveProduction } from '../src/solver/index.ts'
import type { Solution, SolveInput } from '../src/solver/index.ts'

const constructor_ = buildingsById.get('Build_ConstructorMk1_C')!
const smelter = buildingsById.get('Build_SmelterMk1_C')!

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

/** 鉄板 60/min = 製錬炉3台 + 製作機3台（どちらも 4MW） */
const IRON_PLATE_60: SolveInput = { targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] }

describe('製造クロック上限', () => {
  it('既定は100%で、稼働台数の切り上げがそのまま建てる台数になる', async () => {
    const solution = await solveOk(IRON_PLATE_60)
    expect(solution.maxClock).toBe(1)
    for (const step of solution.steps) {
      expect(step.builtCount, step.recipeId).toBe(Math.ceil(step.machineCount - 1e-9))
      expect(step.clockSpeed, step.recipeId).toBeLessThanOrEqual(1)
      expect(step.powerShards, step.recipeId).toBe(0)
    }
    expect(solution.totalPowerShards).toBe(0)
  })

  it('上限250%にすると台数が減り、クロックとパワーシャードが上がる', async () => {
    const base = await solveOk(IRON_PLATE_60)
    const fast = await solveOk({ ...IRON_PLATE_60, maxClock: CLOCK_MAX })

    // LP は不変（稼働台数は同じ）
    expect(fast.totalMachineCount).toBeCloseTo(base.totalMachineCount, 9)
    expect(fast.totalPowerMW).toBeCloseTo(base.totalPowerMW, 9)

    // 3台分を 250% で回すので 2台（3 / 2.5 = 1.2 → 2台を150%）
    for (const step of fast.steps) {
      expect(step.builtCount, step.recipeId).toBe(2)
      expect(step.clockSpeed, step.recipeId).toBeCloseTo(1.5, 9)
      // 150% はパワーシャード1個 × 2台
      expect(step.powerShards, step.recipeId).toBe(2)
    }
    expect(fast.totalBuildingCount).toBe(4)
    expect(base.totalBuildingCount).toBe(6)
    expect(fast.totalPowerShards).toBe(4)
  })

  it('クロックを上げると総電力（クロック適用後）が超線形に増える', async () => {
    const base = await solveOk(IRON_PLATE_60)
    const fast = await solveOk({ ...IRON_PLATE_60, maxClock: CLOCK_MAX })

    // 100%: 3台 × 4MW × 2種類 = 24MW（クロック1なので100%換算と一致）
    expect(base.totalClockedPowerMW).toBeCloseTo(24, 6)
    expect(base.totalClockedPowerMW).toBeCloseTo(base.totalPowerMW, 6)

    // 250%上限: 2台 @150% × 4MW × 2種類
    const expected = 2 * clockedPowerMW(2 * 4, 1.5, constructor_.powerExponent)
    expect(fast.totalClockedPowerMW).toBeCloseTo(expected, 6)
    // 台数は減っても電力は増える（オーバークロックは電力効率が悪い）
    expect(fast.totalClockedPowerMW).toBeGreaterThan(base.totalClockedPowerMW)
    // 100%換算のほうは LP と同じなので変わらない
    expect(fast.totalPowerMW).toBeCloseTo(24, 6)
  })

  it('建設コストは「建てる台数」に連動する（上限を上げると減る）', async () => {
    const base = await solveOk(IRON_PLATE_60)
    const fast = await solveOk({ ...IRON_PLATE_60, maxClock: CLOCK_MAX })
    const total = (s: Solution): number => s.totalBuildCost.reduce((n, c) => n + c.amount, 0)
    expect(total(fast)).toBeLessThan(total(base))
  })

  it('端数の稼働台数はクロックが下がるぶん省電力になる（鉄板 70/min → 製作機3.5台）', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 70 }] })
    const step = solution.steps.find((s) => s.recipeId === 'Recipe_IronPlate_C')!
    expect(step.machineCount).toBeCloseTo(3.5, 6)
    expect(step.builtCount).toBe(4)
    expect(step.clockSpeed).toBeCloseTo(0.875, 9)
    expect(step.clockedPowerMW).toBeCloseTo(
      clockedPowerMW(4 * constructor_.powerConsumptionMW, 0.875, constructor_.powerExponent),
      6,
    )
    // 100%換算（3.5台ぶん = 14MW）より小さい
    expect(step.clockedPowerMW).toBeLessThan(step.powerMW)
  })

  it('範囲外の maxClock は 1〜250% に丸める', async () => {
    const tooHigh = await solveOk({ ...IRON_PLATE_60, maxClock: 99 })
    expect(tooHigh.maxClock).toBe(CLOCK_MAX)
    const nan = await solveOk({ ...IRON_PLATE_60, maxClock: Number.NaN })
    expect(nan.maxClock).toBe(1)
  })
})

describe('採掘クロック', () => {
  const rawResources = [
    { item: 'Desc_OreIron_C', ratePerMin: 240, limitPerMin: null, usageRatio: null },
  ]

  it('クロックを上げると台数が減り、シャードが要る', () => {
    // 採掘機 Mk.1（通常60/min・高純度120/min）で 240/min → 高純度2台
    const base = planExtraction({ rawResources }, { minerId: 'Build_MinerMk1_C' })
    const fast = planExtraction({ rawResources }, { minerId: 'Build_MinerMk1_C', clock: 2 })

    expect(base.clock).toBe(1)
    expect(fast.clock).toBe(2)
    expect(base.totalBuildingCount).toBe(2)
    expect(fast.totalBuildingCount).toBe(1)
    expect(base.totalPowerShards).toBe(0)
    // 200% はシャード2個 × 1台
    expect(fast.totalPowerShards).toBe(2)
  })

  it('採掘電力もクロックに対して超線形に増える', () => {
    const miner = buildingsById.get('Build_MinerMk1_C')!
    const base = planExtraction({ rawResources }, { minerId: 'Build_MinerMk1_C' })
    const fast = planExtraction({ rawResources }, { minerId: 'Build_MinerMk1_C', clock: 2 })

    expect(base.totalPowerMW).toBeCloseTo(2 * miner.powerConsumptionMW, 6)
    expect(fast.totalPowerMW).toBeCloseTo(
      clockedPowerMW(miner.powerConsumptionMW, 2, miner.powerExponent),
      6,
    )
    // 台数半分でも電力は増える
    expect(fast.totalPowerMW).toBeGreaterThan(base.totalPowerMW)
  })

  it('抽出できるレートはクロックぶん増える（同じ台数でより多く採れる）', () => {
    const heavy = [
      { item: 'Desc_OreIron_C', ratePerMin: 480, limitPerMin: null, usageRatio: null },
    ]
    const base = planExtraction({ rawResources: heavy }, { minerId: 'Build_MinerMk1_C' })
    const fast = planExtraction({ rawResources: heavy }, { minerId: 'Build_MinerMk1_C', clock: 2.5 })
    expect(fast.totalBuildingCount).toBeLessThan(base.totalBuildingCount)
    expect(fast.resources[0].shortfallPerMin).toBe(0)
    expect(fast.resources[0].suppliedRatePerMin).toBeCloseTo(480, 6)
  })
})

describe('製錬炉のクロック（既知値の突き合わせ）', () => {
  it('50%の製錬炉は約1.6MW（ゲーム内表示と一致）', async () => {
    // 鉄インゴット 15/min = 製錬炉0.5台 → 1台を50%で回す
    const solution = await solveOk({ targets: [{ item: 'Desc_IronIngot_C', ratePerMin: 15 }] })
    const step = solution.steps[0]
    expect(step.buildingId).toBe(smelter.id)
    expect(step.builtCount).toBe(1)
    expect(step.clockSpeed).toBeCloseTo(0.5, 9)
    expect(step.clockedPowerMW).toBeCloseTo(1.6, 2)
  })
})
