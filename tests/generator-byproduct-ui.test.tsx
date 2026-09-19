// @vitest-environment jsdom
/**
 * 発電計画が無効のまま、副産物（核廃棄物）の需要で発電機が回った解のサマリー表示。
 * ソルバー本体（glpk.js）は jsdom で起動できないので、解はフィクスチャで与える
 * （数値の正しさは tests/generator-byproduct.test.ts が担当する）。
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import { buildingsById } from '../src/data/index.ts'
import { LocaleProvider, getDictionary, preloadLocale } from '../src/i18n/index.ts'
import type { Solution } from '../src/solver/index.ts'
import { SummaryPanel } from '../src/ui/SummaryPanel.tsx'

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

afterEach(() => {
  for (const entry of mounted.splice(0)) entry.unmount()
  document.body.innerHTML = ''
})

const nuclear = buildingsById.get('Build_GeneratorNuclear_C')!

/** プルトニウム・ペレット 10/min を発電計画なしで解いたときの骨格（発電機は需要駆動で 1 台） */
const demandDriven: Solution = {
  status: 'optimal',
  steps: [
    {
      recipeId: 'power:Build_GeneratorNuclear_C:Desc_NuclearFuelRod_C',
      recipeName: { ja: '原子力発電所（ウラン燃料棒）', en: 'Nuclear Power Plant (Uranium Fuel Rod)' },
      buildingId: nuclear.id,
      buildingName: nuclear.name,
      machineCount: 1,
      builtCount: 1,
      clockSpeed: 1,
      powerShards: 0,
      somersloops: 0,
      powerMW: 0,
      clockedPowerMW: 0,
      footprintAreaM2: nuclear.footprint.areaM2,
      inputs: [
        { item: 'Desc_NuclearFuelRod_C', ratePerMin: 0.2 },
        { item: 'Desc_Water_C', ratePerMin: 240 },
      ],
      outputs: [{ item: 'Desc_NuclearWaste_C', ratePerMin: 10 }],
      powerProductionMW: 2500,
      fuelItem: 'Desc_NuclearFuelRod_C',
    },
  ],
  rawResources: [{ item: 'Desc_Water_C', ratePerMin: 240, limitPerMin: null, usageRatio: null }],
  externalInputs: [],
  byproducts: [],
  targets: [{ item: 'Desc_PlutoniumPellet_C', requestedPerMin: 10, producedPerMin: 10 }],
  itemBalance: [],
  totalPowerMW: 400,
  totalPowerRangeMW: { minMW: 400, maxMW: 400 },
  totalClockedPowerMW: 400,
  totalClockedPowerRangeMW: { minMW: 400, maxMW: 400 },
  totalMachineCount: 1,
  totalBuildingCount: 1,
  totalBuildCost: [],
  maxClock: 1,
  totalPowerShards: 0,
  totalSomersloops: 0,
  somersloopLimit: 0,
  totalFootprintAreaM2: nuclear.footprint.areaM2,
  sinkPointsPerMin: 0,
  objectiveValue: 1,
  powerGeneration: {
    targetMW: 0,
    coverFactoryPower: false,
    totalMW: 2500,
    totalGeneratorCount: 1,
    totalGeneratorMachineCount: 1,
    fuelUsage: [{ item: 'Desc_NuclearFuelRod_C', ratePerMin: 0.2 }],
    factoryPowerMW: 400,
    netMW: 2100,
  },
}

describe('需要駆動の発電機のサマリー', () => {
  it.each(['ja', 'en'] as const)('%s: 発電量・差引と、発電計画が無効である注記が出る', async (locale) => {
    await preloadLocale(locale)
    const dictionary = getDictionary(locale)
    const container = await render(
      <LocaleProvider initialLocale={locale}>
        <SummaryPanel solution={demandDriven} extraction={null} />
      </LocaleProvider>,
    )
    const text = container.textContent ?? ''
    expect(text).toContain(dictionary.summary.powerGeneration)
    expect(text).toContain(dictionary.summary.powerGenerationNoTarget)
    expect(text).toContain(dictionary.summary.powerGenerationNet)
    expect(text).toContain(dictionary.summary.powerGenerationDemandDriven)
    expect(text).not.toContain(dictionary.summary.powerGenerationCover)
    expect(text).toMatch(/2[,.]?500/)
    expect(text).toMatch(/2[,.]?100/)
  })

  it('発電計画が有効（目標あり）のときは需要駆動の注記を出さない', async () => {
    await preloadLocale('ja')
    const dictionary = getDictionary('ja')
    const planned: Solution = {
      ...demandDriven,
      powerGeneration: { ...demandDriven.powerGeneration!, targetMW: 2500 },
    }
    const container = await render(
      <LocaleProvider initialLocale="ja">
        <SummaryPanel solution={planned} extraction={null} />
      </LocaleProvider>,
    )
    const text = container.textContent ?? ''
    expect(text).not.toContain(dictionary.summary.powerGenerationDemandDriven)
  })
})
