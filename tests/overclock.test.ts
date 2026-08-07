import { describe, expect, it } from 'vitest'

import { buildingsById } from '../src/data/index.ts'
import { CLOCK_MAX, MAX_POWER_SHARDS_PER_MACHINE } from '../src/data/constants.ts'
import {
  clockedPowerMW,
  planClocks,
  powerShardsForClock,
  solveProduction,
  somersloopOutputMultiplier,
  somersloopPowerMW,
} from '../src/solver/index.ts'

const constructor_ = buildingsById.get('Build_ConstructorMk1_C')!
const smelter = buildingsById.get('Build_SmelterMk1_C')!
const manufacturer = buildingsById.get('Build_ManufacturerMk1_C')!

describe('クロックと消費電力', () => {
  it('100%では基本電力のまま', () => {
    expect(clockedPowerMW(4, 1, constructor_.powerExponent)).toBeCloseTo(4, 9)
  })

  it('250%の製作機は約13.43MW（実ゲーム表示 13.4MW）', () => {
    // 4 × 2.5^log2(2.5) = 4 × 2^(log2(2.5)^2) = 13.431
    expect(clockedPowerMW(4, 2.5, constructor_.powerExponent)).toBeCloseTo(13.431, 3)
    // Docs.json の指数は 1.321929（丸め値）だが理論値 log2(2.5) との差は 1e-5 未満
    expect(clockedPowerMW(4, 2.5, constructor_.powerExponent)).toBeCloseTo(
      clockedPowerMW(4, 2.5, Math.log2(2.5)),
      4,
    )
  })

  it('50%の製錬炉は約1.6MW（実ゲーム表示 1.6MW）', () => {
    expect(clockedPowerMW(4, 0.5, smelter.powerExponent)).toBeCloseTo(1.6, 3)
  })

  it('電力はクロックに対して超線形（オーバークロックは損）', () => {
    const base = clockedPowerMW(55, 1, manufacturer.powerExponent)
    const doubled = clockedPowerMW(55, 2, manufacturer.powerExponent)
    expect(doubled).toBeGreaterThan(base * 2)
  })
})

describe('パワーシャード', () => {
  it('クロックに必要なシャード数', () => {
    expect(powerShardsForClock(1)).toBe(0)
    expect(powerShardsForClock(0.5)).toBe(0)
    expect(powerShardsForClock(1.5)).toBe(1)
    expect(powerShardsForClock(1.75)).toBe(2)
    expect(powerShardsForClock(2)).toBe(2)
    expect(powerShardsForClock(2.5)).toBe(3)
  })

  it('上限は3個（250%）', () => {
    expect(MAX_POWER_SHARDS_PER_MACHINE).toBe(3)
    expect(powerShardsForClock(CLOCK_MAX)).toBe(MAX_POWER_SHARDS_PER_MACHINE)
  })
})

describe('Somersloop', () => {
  it('産出倍率は 1 + 使用数/最大数', () => {
    expect(somersloopOutputMultiplier(0, 4)).toBe(1)
    expect(somersloopOutputMultiplier(2, 4)).toBe(1.5)
    expect(somersloopOutputMultiplier(4, 4)).toBe(2)
    // 最大数を超えても頭打ち
    expect(somersloopOutputMultiplier(8, 4)).toBe(2)
    // 非対応の建物では 1 のまま
    expect(somersloopOutputMultiplier(1, 0)).toBe(1)
  })

  it('消費電力は倍率の2乗（製造機 55MW → 全スロットで 220MW）', () => {
    const exponent = manufacturer.somersloopPowerExponent
    expect(exponent).toBe(2)
    expect(somersloopPowerMW(55, 4, 4, exponent)).toBeCloseTo(220, 9)
    expect(somersloopPowerMW(55, 2, 4, exponent)).toBeCloseTo(55 * 2.25, 9)
    expect(somersloopPowerMW(55, 0, 4, exponent)).toBeCloseTo(55, 9)
  })
})

describe('稼働台数 → クロック割り当て', () => {
  it('3.5台の製錬炉に3つの案が出て、電力の小さい順に並ぶ', () => {
    const plans = planClocks(3.5, smelter)
    expect(plans.map((p) => p.strategy).sort()).toEqual(['even', 'fullPlusPartial', 'overclocked'])
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].totalPowerMW).toBeGreaterThanOrEqual(plans[i - 1].totalPowerMW)
    }

    const even = plans.find((p) => p.strategy === 'even')!
    expect(even.machineCount).toBe(4)
    expect(even.groups).toEqual([
      { count: 4, clockSpeed: 0.875, powerMWEach: expect.any(Number), powerShardsEach: 0 },
    ])
    expect(even.totalPowerShards).toBe(0)

    const partial = plans.find((p) => p.strategy === 'fullPlusPartial')!
    expect(partial.groups.map((g) => [g.count, g.clockSpeed])).toEqual([
      [3, 1],
      [1, 0.5],
    ])
    // 3台 × 4MW + 1台 × 1.6MW
    expect(partial.totalPowerMW).toBeCloseTo(13.6, 3)

    const over = plans.find((p) => p.strategy === 'overclocked')!
    expect(over.machineCount).toBe(2)
    expect(over.groups[0].clockSpeed).toBeCloseTo(1.75, 9)
    expect(over.totalPowerShards).toBe(4) // 1台あたり2個 × 2台
  })

  it('どの案も合計スループットが元の台数と一致する', () => {
    for (const count of [0.4, 1, 2.75, 7.125]) {
      for (const plan of planClocks(count, constructor_)) {
        const throughput = plan.groups.reduce((sum, g) => sum + g.count * g.clockSpeed, 0)
        expect(throughput, `${count}/${plan.strategy}`).toBeCloseTo(count, 9)
      }
    }
  })

  it('整数台のときは端数案が出ない', () => {
    const plans = planClocks(3, smelter)
    expect(plans.some((p) => p.strategy === 'fullPlusPartial')).toBe(false)
    const even = plans.find((p) => p.strategy === 'even')!
    expect(even.machineCount).toBe(3)
    expect(even.groups[0].clockSpeed).toBe(1)
    expect(even.totalPowerMW).toBeCloseTo(12, 9)
  })

  it('1台未満は1台のアンダークロックになる', () => {
    const plans = planClocks(0.25, constructor_)
    const even = plans.find((p) => p.strategy === 'even')!
    expect(even.machineCount).toBe(1)
    expect(even.groups[0].clockSpeed).toBeCloseTo(0.25, 9)
    // オーバークロック案は台数が減らないので出ない
    expect(plans.some((p) => p.strategy === 'overclocked')).toBe(false)
  })

  it('maxClock=1 に縛るとオーバークロック案が出ない', () => {
    const plans = planClocks(6, constructor_, { maxClock: 1 })
    expect(plans.every((p) => p.totalPowerShards === 0)).toBe(true)
    expect(plans.some((p) => p.strategy === 'overclocked')).toBe(false)
  })

  it('0台なら案なし', () => {
    expect(planClocks(0, constructor_)).toEqual([])
  })

  it('可変電力レシピは basePowerMW を上書きして計算できる', () => {
    const plans = planClocks(2.5, constructor_, { basePowerMW: 100 })
    const even = plans.find((p) => p.strategy === 'even')!
    expect(even.totalPowerMW).toBeCloseTo(3 * clockedPowerMW(100, 2.5 / 3, constructor_.powerExponent), 9)
  })

  it('ソルバーの解にそのまま適用できる（鉄板 70/min → 製作機 3.5台）', async () => {
    const result = await solveProduction({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 70 }] })
    expect(result.status).toBe('optimal')
    if (result.status !== 'optimal') return

    const plateStep = result.steps.find((s) => s.recipeId === 'Recipe_IronPlate_C')!
    expect(plateStep.machineCount).toBeCloseTo(3.5, 6)
    // ソルバー直後のクロックは常に100%
    expect(plateStep.clockSpeed).toBe(1)

    const plans = planClocks(plateStep.machineCount, buildingsById.get(plateStep.buildingId)!)
    const best = plans[0]
    // 100%換算の 3.5台分（14MW）よりアンダークロックの方が省電力
    expect(best.totalPowerMW).toBeLessThan(plateStep.powerMW)
  })
})
