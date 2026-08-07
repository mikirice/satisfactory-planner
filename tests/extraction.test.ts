import { describe, expect, it } from 'vitest'

import { mapResourceLimitsByItem, nodesRequired } from '../src/data/map-limits.ts'
import { assignPurityNodes, planExtraction } from '../src/solver/index.ts'
import type { ExtractionInput } from '../src/solver/index.ts'

/** RawResourceUsage の最小構成（planExtraction は rawResources しか見ない） */
function input(entries: [item: string, ratePerMin: number][]): ExtractionInput {
  return {
    rawResources: entries.map(([item, ratePerMin]) => ({
      item,
      ratePerMin,
      limitPerMin: null,
      usageRatio: null,
    })),
  }
}

const MINER_MK1 = 'Build_MinerMk1_C'

// ---------------------------------------------------------------------------
// 純度別ノード割当
// ---------------------------------------------------------------------------

describe('純度別ノード割当（assignPurityNodes）', () => {
  const iron = mapResourceLimitsByItem.get('Desc_OreIron_C')!

  it('純度の高いノードから埋まる', () => {
    // 採掘機 Mk.1（高純度ノード 120/min）で 300/min → 2.5個
    const assigned = assignPurityNodes(300, iron.nodes, 60)
    expect(assigned).toHaveLength(1)
    expect(assigned[0]).toMatchObject({ purity: 'pure', nodes: 2.5, ratePerNodePerMin: 120 })
  })

  it('高純度を使い切ると通常ノードに溢れる', () => {
    const assigned = assignPurityNodes(46 * 120 + 60, iron.nodes, 60)
    expect(assigned.map((a) => [a.purity, a.nodes])).toEqual([
      ['pure', 46],
      ['normal', 1],
    ])
  })

  it('map-limits の nodesRequired と同じ結果になる', () => {
    for (const rate of [90, 1234, 46 * 120 + 500]) {
      expect(assignPurityNodes(rate, iron.nodes, 60).map((a) => ({
        purity: a.purity,
        nodes: a.nodes,
      }))).toEqual(nodesRequired(rate, iron, 60))
    }
  })

  it('クロックを上げるとノード数が減る', () => {
    expect(assignPurityNodes(300, iron.nodes, 60, 2.5)[0].nodes).toBe(1)
  })

  it('0 を要求すると割当なし', () => {
    expect(assignPurityNodes(0, iron.nodes, 60)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 固体（採掘機）
// ---------------------------------------------------------------------------

describe('採掘計画（固体ノード）', () => {
  it('採掘機 Mk.1 で鉄鉱石 300/min → 高純度2.5ノード・3台・12MW', () => {
    const plan = planExtraction(input([['Desc_OreIron_C', 300]]), { minerId: MINER_MK1 })
    expect(plan.resources).toHaveLength(1)

    const iron = plan.resources[0]
    expect(iron.groups).toHaveLength(1)
    const group = iron.groups[0]
    expect(group.extractorId).toBe(MINER_MK1)
    expect(group.machineCount).toBeCloseTo(2.5, 9)
    expect(group.buildingCount).toBe(3)
    expect(group.ratePerMin).toBeCloseTo(300, 9)
    // 満載2台 = 10MW、端数の1台はクロック50% → 5 * 0.5^1.321929 = 2MW
    expect(group.powerMW).toBeCloseTo(12, 4)
    expect(iron.shortfallPerMin).toBe(0)
    expect(plan.totalPowerMW).toBeCloseTo(12, 4)
    expect(plan.totalBuildingCount).toBe(3)
  })

  it('既定は採掘機 Mk.3。480/min はちょうど高純度1ノード・45MW', () => {
    const plan = planExtraction(input([['Desc_OreIron_C', 480]]))
    const group = plan.resources[0].groups[0]
    expect(group.extractorId).toBe('Build_MinerMk3_C')
    expect(group.machineCount).toBeCloseTo(1, 9)
    expect(group.buildingCount).toBe(1)
    expect(group.powerMW).toBeCloseTo(45, 9)
  })

  it('マップのノードを使い切ると不足として残る', () => {
    // ウランは低純度3 + 通常2 のみ。Mk.3・クロック100%で 3*120 + 2*240 = 840/min が上限
    const plan = planExtraction(input([['Desc_OreUranium_C', 1000]]))
    const uranium = plan.resources[0]
    expect(uranium.suppliedRatePerMin).toBeCloseTo(840, 9)
    expect(uranium.shortfallPerMin).toBeCloseTo(160, 9)
    expect(plan.shortfalls).toHaveLength(1)
    expect(plan.shortfalls[0].item).toBe('Desc_OreUranium_C')
  })

  it('建設コストが台数分積み上がる', () => {
    const plan = planExtraction(input([['Desc_OreIron_C', 480]]))
    expect(plan.totalBuildCost.length).toBeGreaterThan(0)
    const doubled = planExtraction(input([['Desc_OreIron_C', 960]]))
    for (const cost of plan.totalBuildCost) {
      const same = doubled.totalBuildCost.find((c) => c.item === cost.item)!
      expect(same.amount).toBe(cost.amount * 2)
    }
  })
})

// ---------------------------------------------------------------------------
// 液体・気体
// ---------------------------------------------------------------------------

describe('採掘計画（液体・気体）', () => {
  it('水は純度もノード数も関係なく汲み上げ機の台数だけで決まる', () => {
    const plan = planExtraction(input([['Desc_Water_C', 600]]))
    const group = plan.resources[0].groups[0]
    expect(group.extractorId).toBe('Build_WaterPump_C')
    expect(group.machineCount).toBeCloseTo(5, 9)
    expect(group.buildingCount).toBe(5)
    expect(group.powerMW).toBeCloseTo(100, 9)
    expect(group.assignments[0].availableNodes).toBe(Number.POSITIVE_INFINITY)
    expect(plan.resources[0].shortfallPerMin).toBe(0)
  })

  it('原油はノードを使い切ってから資源井戸に回る', () => {
    // 原油ノードの100%クロック上限 = (8*2 + 12*1 + 10*0.5) * 120 = 3,960 m³/min
    const plan = planExtraction(input([['Desc_LiquidOil_C', 4000]]))
    const oil = plan.resources[0]
    expect(oil.groups.map((g) => g.extractorId)).toEqual([
      'Build_OilPump_C',
      'Build_FrackingExtractor_C',
    ])
    expect(oil.groups[0].ratePerMin).toBeCloseTo(3960, 6)
    expect(oil.groups[1].ratePerMin).toBeCloseTo(40, 6)
    // サテライトは高純度（120 m³/min）なので 40/120 ノード
    expect(oil.groups[1].machineCount).toBeCloseTo(40 / 120, 9)
    // 資源井戸エクストラクター自体は電力を食わず、加圧機が食う
    expect(oil.groups[1].powerMW).toBe(0)
    expect(oil.groups[1].pressurizerCount).toBe(1)
    expect(oil.groups[1].pressurizerPowerMW).toBeCloseTo(150, 9)
    expect(oil.shortfallPerMin).toBe(0)
  })

  it('窒素ガスは資源井戸のみ。加圧機が電力を持つ', () => {
    // 高純度サテライト（120 m³/min）5個 = 600
    const plan = planExtraction(input([['Desc_NitrogenGas_C', 600]]))
    const nitrogen = plan.resources[0]
    expect(nitrogen.groups).toHaveLength(1)
    const group = nitrogen.groups[0]
    expect(group.extractorId).toBe('Build_FrackingExtractor_C')
    expect(group.machineCount).toBeCloseTo(5, 9)
    expect(group.powerMW).toBe(0)
    // サテライト平均7.5個/基 → 5台なら加圧機1基
    expect(group.pressurizerCount).toBe(1)
    expect(nitrogen.powerMW).toBeCloseTo(150, 9)
    expect(nitrogen.buildingCount).toBe(6) // エクストラクター5 + 加圧機1
    // 加圧機の建設コストが計上されている
    expect(plan.totalBuildCost.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 全体
// ---------------------------------------------------------------------------

describe('採掘計画（全体）', () => {
  it('複数原料の電力と台数が合算され、必要レートの多い順に並ぶ', () => {
    const plan = planExtraction(
      input([
        ['Desc_OreIron_C', 480],
        ['Desc_Water_C', 600],
        ['Desc_OreCopper_C', 960],
      ]),
    )
    expect(plan.resources.map((r) => r.item)).toEqual([
      'Desc_OreCopper_C',
      'Desc_Water_C',
      'Desc_OreIron_C',
    ])
    // 銅 960 = Mk.3 高純度2ノード(90MW) / 水 600 = 5台(100MW) / 鉄 480 = 1ノード(45MW)
    expect(plan.totalPowerMW).toBeCloseTo(90 + 100 + 45, 6)
    expect(plan.totalBuildingCount).toBe(2 + 5 + 1)
    expect(plan.shortfalls).toEqual([])
  })

  it('レート0の原料は無視する', () => {
    expect(planExtraction(input([['Desc_OreIron_C', 0]])).resources).toEqual([])
  })
})
