/**
 * 床面積・ファウンデーション概算の検証。
 *
 * 外形は Docs.json の mClearanceData（建設クリアランス）から出している。
 * ここでは「パースが公式Wikiの寸法と噛み合っているか」と
 * 「概算の組み立て（設置面積 × 通路係数 → ファウンデーション枚数）」を見る。
 */
import { describe, expect, it } from 'vitest'

import { buildings, buildingsById } from '../src/data/index.ts'
import { AISLE_AREA_FACTOR, FOUNDATION_AREA_M2, FOUNDATION_SIZE_M } from '../src/data/constants.ts'
import { estimateFootprint } from '../src/plan/aggregate.ts'
import { parseClearanceBounds } from '../scripts/docs-parse.ts'
import { planExtraction, solveProduction } from '../src/solver/index.ts'
import type { Solution, SolveInput } from '../src/solver/index.ts'

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input)
  if (result.status !== 'optimal') throw new Error(`infeasible: ${result.message}`)
  return result
}

describe('mClearanceData のパース', () => {
  it('平行移動と回転を適用した和を取る（製造機は 18m × 20m）', () => {
    // 1つ目の箱だけ見ると 18 × 12。2つ目（Y に -7m 移動した箱）まで含めて 18 × 20 になる
    const raw =
      '((ClearanceBox=(Min=(X=-900.000000,Y=-300.000000,Z=0.000000),' +
      'Max=(X=900.000000,Y=900.000000,Z=1100.000000),IsValid=True)),' +
      '(ClearanceBox=(Min=(X=-900.000000,Y=-400.000000,Z=-400.000000),' +
      'Max=(X=900.000000,Y=400.000000,Z=-20.000000),IsValid=True),' +
      'RelativeTransform=(Translation=(X=0.000000,Y=-700.000000,Z=400.000000))))'
    const bounds = parseClearanceBounds(raw)!
    expect((bounds.max.x - bounds.min.x) / 100).toBeCloseTo(18, 6)
    expect((bounds.max.y - bounds.min.y) / 100).toBeCloseTo(20, 6)
  })

  it('CT_Soft と ExcludeForSnapping の箱は外形に含めない', () => {
    const raw =
      '((ClearanceBox=(Min=(X=-400.000000,Y=-500.000000,Z=0.000000),' +
      'Max=(X=400.000000,Y=500.000000,Z=600.000000),IsValid=True)),' +
      '(Type=CT_Soft,ClearanceBox=(Min=(X=-5000.000000,Y=-5000.000000,Z=0.000000),' +
      'Max=(X=5000.000000,Y=5000.000000,Z=100.000000),IsValid=True)),' +
      '(ClearanceBox=(Min=(X=-9000.000000,Y=-9000.000000,Z=0.000000),' +
      'Max=(X=9000.000000,Y=9000.000000,Z=100.000000),IsValid=True),ExcludeForSnapping=True))'
    const bounds = parseClearanceBounds(raw)!
    expect((bounds.max.x - bounds.min.x) / 100).toBeCloseTo(8, 6)
    expect((bounds.max.y - bounds.min.y) / 100).toBeCloseTo(10, 6)
  })

  it('クリアランスが無ければ null', () => {
    expect(parseClearanceBounds(undefined)).toBeNull()
    expect(parseClearanceBounds('')).toBeNull()
    expect(parseClearanceBounds('()')).toBeNull()
  })
})

describe('建物データの外形', () => {
  it('すべての建物が正の設置面積を持つ', () => {
    for (const building of buildings) {
      expect(building.footprint.widthM, building.id).toBeGreaterThan(0)
      expect(building.footprint.depthM, building.id).toBeGreaterThan(0)
      expect(building.footprint.heightM, building.id).toBeGreaterThan(0)
      expect(building.footprint.areaM2, building.id).toBeCloseTo(
        building.footprint.widthM * building.footprint.depthM,
        2,
      )
    }
  })

  it('1.1.x では全建物が Docs 由来（Wiki フォールバックは不要）', () => {
    expect(buildings.filter((b) => b.footprint.source === 'fallback')).toEqual([])
  })

  it('主要な建物の寸法が公式Wikiの記載と一致する', () => {
    // 出典: https://satisfactory.wiki.gg/wiki/<建物名> の Dimensions（2026-08-08 参照）
    const expected: Record<string, [number, number]> = {
      Build_ConstructorMk1_C: [8, 10],
      Build_SmelterMk1_C: [5, 10],
      Build_AssemblerMk1_C: [9, 16],
      Build_ManufacturerMk1_C: [18, 20],
      Build_FoundryMk1_C: [10, 10],
      Build_OilRefinery_C: [10, 22],
      Build_Packager_C: [8, 8],
      Build_Blender_C: [18, 16],
    }
    for (const [id, [widthM, depthM]] of Object.entries(expected)) {
      const footprint = buildingsById.get(id)!.footprint
      expect(footprint.widthM, id).toBeCloseTo(widthM, 1)
      expect(footprint.depthM, id).toBeCloseTo(depthM, 1)
    }
  })
})

describe('床面積の概算', () => {
  it('ステップの設置面積は「建てる台数 × 1台の面積」', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    for (const step of solution.steps) {
      const area = buildingsById.get(step.buildingId)!.footprint.areaM2
      expect(step.footprintAreaM2, step.recipeId).toBeCloseTo(step.builtCount * area, 6)
    }
    expect(solution.totalFootprintAreaM2).toBeCloseTo(
      solution.steps.reduce((a, s) => a + s.footprintAreaM2, 0),
      6,
    )
    // 製錬炉 3台 × 50m² + 製作機 3台 × 80m²
    expect(solution.totalFootprintAreaM2).toBeCloseTo(3 * 50 + 3 * 80, 6)
  })

  it('概算 = 設置面積合計 × 通路係数、ファウンデーションは 8m × 8m 換算', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    const extraction = planExtraction(solution)
    const estimate = estimateFootprint(solution, extraction)

    expect(FOUNDATION_SIZE_M).toBe(8)
    expect(FOUNDATION_AREA_M2).toBe(64)
    expect(estimate.aisleFactor).toBe(AISLE_AREA_FACTOR)
    expect(estimate.manufacturingAreaM2).toBeCloseTo(solution.totalFootprintAreaM2, 6)
    expect(estimate.extractionAreaM2).toBeCloseTo(extraction.totalFootprintAreaM2, 6)
    expect(estimate.buildingAreaM2).toBeCloseTo(
      estimate.manufacturingAreaM2 + estimate.extractionAreaM2,
      6,
    )
    expect(estimate.totalAreaM2).toBeCloseTo(estimate.buildingAreaM2 * AISLE_AREA_FACTOR, 6)
    expect(estimate.foundations).toBe(
      Math.max(0, Math.ceil(estimate.totalAreaM2 / FOUNDATION_AREA_M2 - 1e-9)),
    )
  })

  it('採掘設備の面積も数える（採掘機1台ぶんが入る）', async () => {
    const solution = await solveOk({ targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] })
    const extraction = planExtraction(solution, { minerId: 'Build_MinerMk3_C' })
    const miner = buildingsById.get('Build_MinerMk3_C')!
    expect(extraction.totalBuildingCount).toBe(1)
    expect(extraction.totalFootprintAreaM2).toBeCloseTo(miner.footprint.areaM2, 6)

    const withExtraction = estimateFootprint(solution, extraction)
    const withoutExtraction = estimateFootprint(solution, null)
    expect(withExtraction.totalAreaM2).toBeGreaterThan(withoutExtraction.totalAreaM2)
    expect(withoutExtraction.extractionAreaM2).toBe(0)
  })

  it('クロック上限を上げると台数が減るので床面積も減る', async () => {
    const input: SolveInput = { targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] }
    const base = await solveOk(input)
    const fast = await solveOk({ ...input, maxClock: 2.5 })
    expect(fast.totalFootprintAreaM2).toBeLessThan(base.totalFootprintAreaM2)
  })

  it('目標が空なら 0 m²・0 枚', async () => {
    const solution = await solveOk({ targets: [] })
    const estimate = estimateFootprint(solution, null)
    expect(estimate.totalAreaM2).toBe(0)
    expect(estimate.foundations).toBe(0)
  })
})
