// @vitest-environment jsdom
/**
 * 建設リストの画面（src/ui/BuildListView.tsx）。
 *
 * この画面は読み取り専用の一覧。見たいのは
 *   セクションの並びと中身 / 設備ごとの台数 / セクション小計と全体合計 /
 *   クロック・搬送等級が出ること / 操作系（チェック・カウンター・進捗バー）を持たないこと
 *
 * ソルバーは jsdom で動かせないので、解は tests/ui.test.tsx と同じ作りのフィクスチャを使う。
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import { buildingsById } from '../src/data/index.ts'
import { clockedPowerMW, planExtraction } from '../src/solver/index.ts'
import type { Solution } from '../src/solver/index.ts'
import { BuildListView } from '../src/ui/BuildListView.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mounted: { unmount: () => void }[] = []

async function render(node: ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(node)
  })
  mounted.push({ unmount: () => root.unmount() })
  return container
}

afterEach(async () => {
  await act(async () => {
    for (const m of mounted.splice(0)) m.unmount()
  })
  document.body.innerHTML = ''
})

// ---------------------------------------------------------------------------
// 鉄板 60/min 相当の解（製錬炉3台 + 製作機4台 = 7台）
// ---------------------------------------------------------------------------

const smelter = buildingsById.get('Build_SmelterMk1_C')!
const constructor_ = buildingsById.get('Build_ConstructorMk1_C')!
const plateClockedPowerMW = clockedPowerMW(4 * 4, 3.5 / 4, constructor_.powerExponent)

const solution: Solution = {
  status: 'optimal',
  steps: [
    {
      recipeId: 'Recipe_IronPlate_C',
      recipeName: { ja: '鉄板', en: 'Iron Plate' },
      buildingId: 'Build_ConstructorMk1_C',
      buildingName: { ja: '製作機', en: 'Constructor' },
      machineCount: 3.5,
      builtCount: 4,
      clockSpeed: 3.5 / 4,
      powerShards: 0,
      somersloops: 0,
      powerMW: 14,
      clockedPowerMW: plateClockedPowerMW,
      footprintAreaM2: 4 * constructor_.footprint.areaM2,
      inputs: [{ item: 'Desc_IronIngot_C', ratePerMin: 105 }],
      outputs: [{ item: 'Desc_IronPlate_C', ratePerMin: 70 }],
    },
    {
      recipeId: 'Recipe_IngotIron_C',
      recipeName: { ja: '鉄のインゴット', en: 'Iron Ingot' },
      buildingId: 'Build_SmelterMk1_C',
      buildingName: { ja: '製錬炉', en: 'Smelter' },
      machineCount: 3,
      builtCount: 3,
      clockSpeed: 1,
      powerShards: 0,
      somersloops: 0,
      powerMW: 12,
      clockedPowerMW: 12,
      footprintAreaM2: 3 * smelter.footprint.areaM2,
      inputs: [{ item: 'Desc_OreIron_C', ratePerMin: 90 }],
      outputs: [{ item: 'Desc_IronIngot_C', ratePerMin: 90 }],
    },
  ],
  rawResources: [
    { item: 'Desc_OreIron_C', ratePerMin: 90, limitPerMin: 92_100, usageRatio: 90 / 92_100 },
  ],
  externalInputs: [],
  byproducts: [],
  targets: [{ item: 'Desc_IronPlate_C', requestedPerMin: 60, producedPerMin: 70 }],
  itemBalance: [],
  totalPowerMW: 26,
  totalPowerRangeMW: { minMW: 26, maxMW: 26 },
  totalClockedPowerMW: 12 + plateClockedPowerMW,
  totalClockedPowerRangeMW: { minMW: 12 + plateClockedPowerMW, maxMW: 12 + plateClockedPowerMW },
  totalMachineCount: 6.5,
  totalBuildingCount: 7,
  totalBuildCost: [],
  maxClock: 1,
  totalPowerShards: 0,
  totalSomersloops: 0,
  somersloopLimit: 0,
  totalFootprintAreaM2: 3 * smelter.footprint.areaM2 + 4 * constructor_.footprint.areaM2,
  sinkPointsPerMin: 120,
  objectiveValue: 90,
}

const rows = (container: HTMLElement): HTMLLIElement[] => [
  ...container.querySelectorAll<HTMLLIElement>('.build-item'),
]

const totalText = (container: HTMLElement): string =>
  container.querySelector('.build-total')?.textContent ?? ''

const sectionTotals = (container: HTMLElement): string[] =>
  [...container.querySelectorAll<HTMLElement>('.card__meta')].map(
    (meta) => meta.textContent ?? '',
  )

describe('建設リストの表示', () => {
  it('セクションと工程が依存順に並び、台数・クロック・ベルト等級が出る', async () => {
    const container = await render(
      <BuildListView solution={solution} extraction={planExtraction(solution)} />,
    )
    const text = container.textContent ?? ''

    expect(text).toContain('原料の採掘・給水')
    expect(text).toContain('製造ライン')
    expect(text).toContain('採鉱機 Mk.3')
    expect(text).toContain('製錬炉')
    expect(text).toContain('製作機')
    // 3.5台 → 4台を87.5%で回す
    expect(text).toContain('87.5%')
    // 鉄鉱石 90/min は Mk.2（120/min）1本で運べる
    expect(text).toContain('コンベア・ベルト Mk.2')

    // 製錬炉（投入=鉄鉱石）が製作機（投入=鉄インゴット）より前
    const names = rows(container).map((row) => row.querySelector('.build-item__name')?.textContent)
    expect(names.indexOf('製錬炉')).toBeLessThan(names.indexOf('製作機'))
  })

  it('工程ごとに建てる台数を出す', async () => {
    const container = await render(<BuildListView solution={solution} extraction={null} />)
    const counts = rows(container).map((row) => row.querySelector('.build-item__count')?.textContent)

    // 製錬炉3台 → 製作機4台（並びは依存順のまま）
    expect(counts).toEqual(['×3 台', '×4 台'])
  })

  it('セクションの小計と全体の合計を出す', async () => {
    const container = await render(
      <BuildListView solution={solution} extraction={planExtraction(solution)} />,
    )

    // 採掘1台 + 製造ライン7台
    expect(sectionTotals(container)).toEqual(['小計 1 台', '小計 7 台'])
    expect(totalText(container)).toBe('合計 8 台')
  })

  it('発電の項目は発電機の名前・燃料・発電量で出す（内部IDを見せない）', async () => {
    const coal = buildingsById.get('Build_GeneratorCoal_C')!
    const powered: Solution = {
      ...solution,
      steps: [
        ...solution.steps,
        {
          recipeId: 'power:Build_GeneratorCoal_C:Desc_Coal_C',
          recipeName: { ja: '石炭発電機（石炭）', en: 'Coal-Powered Generator (Coal)' },
          buildingId: 'Build_GeneratorCoal_C',
          buildingName: coal.name,
          machineCount: 4,
          builtCount: 4,
          clockSpeed: 1,
          powerShards: 0,
          somersloops: 0,
          powerMW: 0,
          clockedPowerMW: 0,
          footprintAreaM2: 4 * coal.footprint.areaM2,
          inputs: [
            { item: 'Desc_Coal_C', ratePerMin: 60 },
            { item: 'Desc_Water_C', ratePerMin: 180 },
          ],
          outputs: [],
          powerProductionMW: 300,
          fuelItem: 'Desc_Coal_C',
        },
      ],
    }
    const container = await render(<BuildListView solution={powered} extraction={null} />)
    const text = container.textContent ?? ''

    expect(text).toContain('発電')
    expect(text).toContain('石炭発電機')
    expect(text).toContain('燃料: 石炭')
    expect(text).toContain('300.00 MW')
    // 水 180 m³/min はパイプ Mk.1（300 m³/min）で1本
    expect(text).toContain('パイプラインMk.1')
    expect(text).not.toContain('power:Build_GeneratorCoal_C')
    expect(rows(container).at(-1)?.querySelector('.build-item__count')?.textContent).toBe('×4 台')
    // 製造7台 + 発電4台
    expect(totalText(container)).toBe('合計 11 台')
  })

  it('建てるものが無ければ空状態を出す', async () => {
    const empty: Solution = { ...solution, steps: [], totalBuildingCount: 0 }
    const container = await render(<BuildListView solution={empty} extraction={null} />)

    expect(container.textContent).toContain('建てるものがありません')
    expect(container.querySelector('.build-total')).toBeNull()
  })
})

describe('操作系を持たない（読み取り専用）', () => {
  it('チェックボックス・カウンター・進捗バー・リセットを出さない', async () => {
    const container = await render(
      <BuildListView solution={solution} extraction={planExtraction(solution)} />,
    )

    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(container.querySelector('.build-bar')).toBeNull()
    expect(container.querySelector('.build-counter')).toBeNull()
    expect(container.querySelector('.build-wake')).toBeNull()
    // 消し込み前提の文言も残っていない
    const text = container.textContent ?? ''
    expect(text).not.toContain('建てた')
    expect(text).not.toContain('進捗')
  })

  it('localStorage が無い環境でも表示できる（保存を一切しない）', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Reflect.deleteProperty(window, 'localStorage')
    try {
      const container = await render(<BuildListView solution={solution} extraction={null} />)
      expect(rows(container)).toHaveLength(2)
      expect(totalText(container)).toBe('合計 7 台')
    } finally {
      if (original !== undefined) Object.defineProperty(window, 'localStorage', original)
    }
  })
})
