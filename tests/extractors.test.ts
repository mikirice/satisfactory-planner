import { describe, expect, it } from 'vitest'

import {
  belts,
  buildingsById,
  extractors,
  extractorsById,
  items,
  itemsById,
  pipes,
  rawResourceItems,
} from '../src/data/index.ts'
import { PURITY_MULTIPLIER } from '../src/data/constants.ts'
import {
  MAP_RESOURCE_LIMITS,
  computeMaxRatePerMin,
  mapResourceLimitsByItem,
  nodesRequired,
  purityWeightedNodes,
  totalNodeCount,
} from '../src/data/map-limits.ts'
import { linesRequired, linesRequiredByTier, transportKind } from '../src/solver/index.ts'

// ---------------------------------------------------------------------------
// 原料フラグ
// ---------------------------------------------------------------------------

describe('原料（FGResourceDescriptor 由来）', () => {
  it('1.1.x の原料は13種で、既知のIDと一致する', () => {
    expect(rawResourceItems).toHaveLength(13)
    expect(rawResourceItems.map((i) => i.id).sort()).toEqual([
      'Desc_Coal_C',
      'Desc_LiquidOil_C',
      'Desc_NitrogenGas_C',
      'Desc_OreBauxite_C',
      'Desc_OreCopper_C',
      'Desc_OreGold_C',
      'Desc_OreIron_C',
      'Desc_OreUranium_C',
      'Desc_RawQuartz_C',
      'Desc_SAM_C',
      'Desc_Stone_C',
      'Desc_Sulfur_C',
      'Desc_Water_C',
    ])
  })

  it('加工品は原料フラグを持たない', () => {
    for (const id of ['Desc_IronIngot_C', 'Desc_IronPlate_C', 'Desc_HeavyOilResidue_C', 'Desc_Plastic_C']) {
      expect(itemsById.get(id)!.isRawResource, id).toBe(false)
    }
    // 原料以外がフラグを立てていない
    expect(items.filter((i) => i.isRawResource)).toHaveLength(13)
  })
})

// ---------------------------------------------------------------------------
// 採掘・抽出設備
// ---------------------------------------------------------------------------

describe('採掘・抽出設備（extractors.json）', () => {
  it('採掘機の基準レートが実ゲームの値と一致する（通常ノード・クロック100%）', () => {
    expect(extractorsById.get('Build_MinerMk1_C')!.baseRatePerMin).toBe(60)
    expect(extractorsById.get('Build_MinerMk2_C')!.baseRatePerMin).toBe(120)
    expect(extractorsById.get('Build_MinerMk3_C')!.baseRatePerMin).toBe(240)
  })

  it('液体・気体の抽出レートが1000倍のままになっていない', () => {
    expect(extractorsById.get('Build_OilPump_C')!.baseRatePerMin).toBe(120)
    expect(extractorsById.get('Build_WaterPump_C')!.baseRatePerMin).toBe(120)
    expect(extractorsById.get('Build_FrackingExtractor_C')!.baseRatePerMin).toBe(60)
  })

  it('純度倍率を掛けると各純度の実レートになる（採掘機 Mk.1）', () => {
    const miner = extractorsById.get('Build_MinerMk1_C')!
    expect(miner.baseRatePerMin * PURITY_MULTIPLIER.impure).toBe(30)
    expect(miner.baseRatePerMin * PURITY_MULTIPLIER.normal).toBe(60)
    expect(miner.baseRatePerMin * PURITY_MULTIPLIER.pure).toBe(120)
  })

  it('抽出できる資源とカテゴリが正しい', () => {
    // 採掘機は固体ノードなら何でも掘れる
    const miner = extractorsById.get('Build_MinerMk1_C')!
    expect(miner.category).toBe('miner')
    expect(miner.allowedResources).toBeNull()
    expect(miner.allowedForms).toEqual(['solid'])

    const oil = extractorsById.get('Build_OilPump_C')!
    expect(oil.category).toBe('oilExtractor')
    expect(oil.allowedResources).toEqual(['Desc_LiquidOil_C'])

    const well = extractorsById.get('Build_FrackingExtractor_C')!
    expect(well.category).toBe('wellExtractor')
    expect(well.allowedResources).toEqual(['Desc_LiquidOil_C', 'Desc_NitrogenGas_C', 'Desc_Water_C'])
  })

  it('水の汲み上げ機だけ純度の影響を受けない', () => {
    expect(extractorsById.get('Build_WaterPump_C')!.purityAffected).toBe(false)
    expect(extractorsById.get('Build_MinerMk1_C')!.purityAffected).toBe(true)
    expect(extractorsById.get('Build_OilPump_C')!.purityAffected).toBe(true)
  })

  it('資源井戸加圧機は自身では抽出せず、電力だけを食う', () => {
    const pressurizer = extractorsById.get('Build_FrackingSmasher_C')!
    expect(pressurizer.category).toBe('wellPressurizer')
    expect(pressurizer.baseRatePerMin).toBe(0)
    expect(pressurizer.powerConsumptionMW).toBe(150)
    // 逆にサテライト側のエクストラクターは電力を食わない
    expect(extractorsById.get('Build_FrackingExtractor_C')!.powerConsumptionMW).toBe(0)
  })

  it('全ての抽出設備が buildings に対応づき、電力パラメータが妥当', () => {
    expect(extractors).toHaveLength(7)
    for (const e of extractors) {
      const building = buildingsById.get(e.id)
      expect(building, e.id).toBeDefined()
      expect(building!.category).toBe('extractor')
      expect(e.name.ja.length, e.id).toBeGreaterThan(0)
      expect(e.powerConsumptionMW, e.id).toBeGreaterThanOrEqual(0)
      expect(e.powerExponent, e.id).toBeGreaterThan(1)
      expect(e.baseRatePerMin, e.id).toBeGreaterThanOrEqual(0)
      if (e.allowedResources) {
        for (const id of e.allowedResources) expect(itemsById.has(id), `${e.id} -> ${id}`).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// マップ資源量
// ---------------------------------------------------------------------------

describe('マップ資源量（map-limits.ts）', () => {
  const MINER_MK3 = 240
  const OIL_PUMP = 120
  const WELL_EXTRACTOR = 60

  it('固体資源: ノード数から計算した最大レートが公称値と一致する', () => {
    const solids = MAP_RESOURCE_LIMITS.filter(
      (r) => itemsById.get(r.item)!.form === 'solid',
    )
    expect(solids).toHaveLength(10)
    for (const limit of solids) {
      expect(computeMaxRatePerMin(limit, MINER_MK3, WELL_EXTRACTOR), limit.item).toBeCloseTo(
        limit.maxRatePerMin!,
        6,
      )
    }
  })

  it('原油: ノード 9,900 + 資源井戸 2,700 = 12,600 m³/min', () => {
    const oil = mapResourceLimitsByItem.get('Desc_LiquidOil_C')!
    expect(purityWeightedNodes(oil.nodes) * OIL_PUMP * 2.5).toBeCloseTo(9_900, 6)
    expect(purityWeightedNodes(oil.wells) * WELL_EXTRACTOR * 2.5).toBeCloseTo(2_700, 6)
    expect(computeMaxRatePerMin(oil, OIL_PUMP, WELL_EXTRACTOR)).toBeCloseTo(12_600, 6)
    expect(oil.maxRatePerMin).toBe(12_600)
  })

  it('窒素ガス: 資源井戸のみで 12,000 m³/min（サテライト45個）', () => {
    const nitrogen = mapResourceLimitsByItem.get('Desc_NitrogenGas_C')!
    expect(totalNodeCount(nitrogen.nodes)).toBe(0)
    expect(totalNodeCount(nitrogen.wells)).toBe(45)
    expect(computeMaxRatePerMin(nitrogen, 0, WELL_EXTRACTOR)).toBeCloseTo(12_000, 6)
  })

  it('水は上限なし（水面に汲み上げ機を無制限に置けるため）', () => {
    expect(mapResourceLimitsByItem.get('Desc_Water_C')!.maxRatePerMin).toBeNull()
  })

  it('全13原料に上限エントリがある', () => {
    expect(MAP_RESOURCE_LIMITS).toHaveLength(13)
    for (const item of rawResourceItems) {
      expect(mapResourceLimitsByItem.has(item.id), item.id).toBe(true)
    }
  })

  it('鉄鉱石のノード内訳が公称値（39/42/46・計127）', () => {
    const iron = mapResourceLimitsByItem.get('Desc_OreIron_C')!
    expect(iron.nodes).toEqual({ impure: 39, normal: 42, pure: 46 })
    expect(totalNodeCount(iron.nodes)).toBe(127)
    expect(purityWeightedNodes(iron.nodes)).toBeCloseTo(153.5, 9)
  })

  it('必要ノード数の見積もりが純度の高い順に埋まる', () => {
    const iron = mapResourceLimitsByItem.get('Desc_OreIron_C')!
    // 採掘機 Mk.1（純ノード 120/min）で 300/min → 純ノード 2.5個
    expect(nodesRequired(300, iron, 60)).toEqual([{ purity: 'pure', nodes: 2.5 }])
    // 純ノード46個（5,520/min）を超える分は通常ノードへ
    const big = nodesRequired(46 * 120 + 60, iron, 60)
    expect(big).toEqual([
      { purity: 'pure', nodes: 46 },
      { purity: 'normal', nodes: 1 },
    ])
    expect(nodesRequired(0, iron, 60)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// ベルト / パイプ
// ---------------------------------------------------------------------------

describe('物流（ベルト・パイプ）', () => {
  it('ベルトMk.1〜6の搬送量が実ゲームの値と一致する', () => {
    expect(belts.map((b) => b.itemsPerMin)).toEqual([60, 120, 270, 480, 780, 1200])
    expect(belts.map((b) => b.id)).toEqual([
      'Build_ConveyorBeltMk1_C',
      'Build_ConveyorBeltMk2_C',
      'Build_ConveyorBeltMk3_C',
      'Build_ConveyorBeltMk4_C',
      'Build_ConveyorBeltMk5_C',
      'Build_ConveyorBeltMk6_C',
    ])
  })

  it('パイプMk.1/2の流量が 300 / 600 m³/min', () => {
    expect(pipes.map((p) => p.m3PerMin)).toEqual([300, 600])
    expect(pipes.map((p) => p.id)).toEqual(['Build_Pipeline_C', 'Build_PipelineMK2_C'])
  })

  it('固体はベルト、液体・気体はパイプで判定される', () => {
    expect(transportKind('Desc_IronPlate_C')).toBe('belt')
    expect(transportKind('Desc_Water_C')).toBe('pipe')
    expect(transportKind('Desc_NitrogenGas_C')).toBe('pipe')
  })

  it('必要本数が切り上げで求まる', () => {
    // 既定は最速の Mk（ベルト Mk.6 = 1200/min）
    expect(linesRequired(1200, 'Desc_IronPlate_C')).toMatchObject({
      id: 'Build_ConveyorBeltMk6_C',
      capacityPerMin: 1200,
      lines: 1,
    })
    expect(linesRequired(1200.5, 'Desc_IronPlate_C').lines).toBe(2)
    expect(linesRequired(0, 'Desc_IronPlate_C').lines).toBe(0)
    // Mk 指定
    expect(linesRequired(1200, 'Desc_IronPlate_C', 'Build_ConveyorBeltMk1_C').lines).toBe(20)
    // 液体はパイプ
    expect(linesRequired(300, 'Desc_Water_C')).toMatchObject({
      id: 'Build_PipelineMK2_C',
      capacityPerMin: 600,
      lines: 1,
      utilization: 0.5,
    })
  })

  it('Mk別の一覧が遅い順に並ぶ', () => {
    const tiers = linesRequiredByTier(600, 'Desc_IronPlate_C')
    expect(tiers.map((t) => t.lines)).toEqual([10, 5, 3, 2, 1, 1])
    expect(tiers[0].id).toBe('Build_ConveyorBeltMk1_C')
  })

  it('未知の Mk を指定すると例外', () => {
    expect(() => linesRequired(60, 'Desc_IronPlate_C', 'Build_Nope_C')).toThrow(/unknown transport tier/)
  })
})
