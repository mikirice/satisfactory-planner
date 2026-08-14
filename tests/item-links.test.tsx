// @vitest-environment jsdom
/**
 * 結果テーブルのアイテム名から静的アイテムページ（/items/{slug}/）へ飛べることのテスト。
 *
 * 見たいのは次の3点。
 * 1. 表のアイテム名が `<a href="/items/{slug}/">` になり、リンク文字が表示中ロケールの名前であること
 * 2. アイコンはリンクに含めないこと（誤タップと読み上げの冗長を避けるため）
 * 3. リンク先が src/plan/item-pages.ts の実装（＝静的ページ生成と同じ）と一致すること
 *
 * 生成ファイルとの突き合わせは tests/build-pages.test.ts が担当する。
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import { buildingsById } from '../src/data/index.ts'
import { LocaleProvider, SUPPORTED_LOCALES, getDictionary } from '../src/i18n/index.ts'
import type { Locale } from '../src/i18n/index.ts'
import { itemPagePath } from '../src/plan/item-pages.ts'
import { defaultPlanInput } from '../src/plan/serialize.ts'
import { setPlanStorage } from '../src/plan/storage.ts'
import { clockedPowerMW } from '../src/solver/index.ts'
import type { Solution } from '../src/solver/index.ts'
import { usePlanner } from '../src/store/planner.ts'
import { BalanceTable } from '../src/ui/BalanceTable.tsx'
import { RecipeBrowser } from '../src/ui/RecipeBrowser.tsx'
import { ResourcesTable } from '../src/ui/ResourcesTable.tsx'
import { StepsTable } from '../src/ui/StepsTable.tsx'
import { SummaryPanel } from '../src/ui/SummaryPanel.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mounted: { unmount: () => void }[] = []

async function render(node: ReactNode, locale: Locale = 'ja'): Promise<HTMLElement> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(<LocaleProvider initialLocale={locale}>{node}</LocaleProvider>)
  })
  mounted.push({ unmount: () => root.unmount() })
  return container
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => element.click())
}

afterEach(async () => {
  await act(async () => {
    for (const entry of mounted.splice(0)) entry.unmount()
  })
  document.body.innerHTML = ''
  setPlanStorage(null)
  usePlanner.setState({
    ...defaultPlanInput(),
    targets: [],
    inputs: [],
    loadedTemplateId: null,
    status: 'idle',
    result: null,
    extraction: null,
    error: null,
    elapsedMs: 0,
  })
})

/** リンクを探す（href 完全一致）。 */
function links(container: HTMLElement, href: string): HTMLAnchorElement[] {
  return [...container.querySelectorAll<HTMLAnchorElement>(`a[href="${href}"]`)]
}

const IRON_PLATE_PATH = '/items/iron-plate/'
// slug は ID 由来なので Desc_OreIron_C は ore-iron（表示名の語順ではない）
const IRON_ORE_PATH = '/items/ore-iron/'
const IRON_INGOT_PATH = '/items/iron-ingot/'

// ---------------------------------------------------------------------------
// 表示専用の解フィクスチャ（鉄板 60/min 相当。tests/locale.test.tsx と同じ作り）
// ---------------------------------------------------------------------------

const smelter = buildingsById.get('Build_SmelterMk1_C')!
const constructor_ = buildingsById.get('Build_ConstructorMk1_C')!
const plateClockedPowerMW = clockedPowerMW(4 * 4, 3.5 / 4, constructor_.powerExponent)

const ironPlate60: Solution = {
  status: 'optimal',
  steps: [
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
  ],
  rawResources: [
    { item: 'Desc_OreIron_C', ratePerMin: 90, limitPerMin: 92_100, usageRatio: 90 / 92_100 },
  ],
  externalInputs: [
    { item: 'Desc_IronIngot_C', availablePerMin: 20, ratePerMin: 15 },
  ],
  byproducts: [{ item: 'Desc_IronIngot_C', ratePerMin: 5 }],
  targets: [{ item: 'Desc_IronPlate_C', requestedPerMin: 60, producedPerMin: 60 }],
  itemBalance: [
    {
      item: 'Desc_IronPlate_C',
      producedPerMin: 60,
      consumedPerMin: 0,
      suppliedPerMin: 0,
      netPerMin: 60,
    },
  ],
  totalPowerMW: 26,
  totalPowerRangeMW: { minMW: 26, maxMW: 26 },
  totalClockedPowerMW: 12 + plateClockedPowerMW,
  totalClockedPowerRangeMW: { minMW: 12 + plateClockedPowerMW, maxMW: 12 + plateClockedPowerMW },
  totalMachineCount: 6.5,
  totalBuildingCount: 7,
  totalBuildCost: [{ item: 'Desc_IronPlate_C', amount: 30 }],
  maxClock: 1,
  totalPowerShards: 0,
  totalSomersloops: 0,
  somersloopLimit: 0,
  totalFootprintAreaM2: 3 * smelter.footprint.areaM2 + 4 * constructor_.footprint.areaM2,
  sinkPointsPerMin: 120,
  objectiveValue: 90,
}

// ---------------------------------------------------------------------------

describe('アイテムページへのリンク先', () => {
  it('slug は静的ページ生成と同じ実装から作る', () => {
    expect(itemPagePath('Desc_IronPlate_C')).toBe(IRON_PLATE_PATH)
    expect(itemPagePath('Desc_OreIron_C')).toBe(IRON_ORE_PATH)
    expect(itemPagePath('Desc_IronIngot_C')).toBe(IRON_INGOT_PATH)
  })
})

describe('結果テーブルのアイテム名リンク', () => {
  it.each(SUPPORTED_LOCALES)(
    '%s: 生産ステップの投入・産出がアイテムページへのリンクになる',
    async (locale) => {
      const container = await render(<StepsTable solution={ironPlate60} />, locale)
      const ingotLinks = links(container, IRON_INGOT_PATH)
      const expectedName = locale === 'ja' ? '鉄のインゴット' : 'Iron Ingot'

      // 産出（製錬炉）と投入（製作機）の2か所
      expect(ingotLinks).toHaveLength(2)
      expect(ingotLinks.every((link) => link.textContent === expectedName)).toBe(true)
      expect(links(container, IRON_ORE_PATH)).toHaveLength(1)
      expect(links(container, IRON_PLATE_PATH)).toHaveLength(1)
      // アイコンはリンクの外に置く（アイコン自体はリンクにしない）
      expect(container.querySelector('a .item-icon')).toBeNull()
      // 通常遷移（target なし・同一タブ）
      expect(ingotLinks[0]?.getAttribute('target')).toBeNull()
    },
  )

  it.each(SUPPORTED_LOCALES)('%s: 原料表のアイテム名がリンクになる', async (locale) => {
    const container = await render(
      <ResourcesTable solution={ironPlate60} extraction={null} />,
      locale,
    )
    const oreLinks = links(container, IRON_ORE_PATH)

    expect(oreLinks).toHaveLength(1)
    expect(oreLinks[0]?.textContent).toBe(locale === 'ja' ? '鉄鉱石' : 'Iron Ore')
  })

  it.each(SUPPORTED_LOCALES)('%s: アイテム収支表のアイテム名がリンクになる', async (locale) => {
    const container = await render(<BalanceTable solution={ironPlate60} />, locale)
    const plateLinks = links(container, IRON_PLATE_PATH)

    expect(plateLinks).toHaveLength(1)
    expect(plateLinks[0]?.textContent).toBe(locale === 'ja' ? '鉄板' : 'Iron Plate')
    // 単位（個/分）はリンクの外
    expect(plateLinks[0]?.querySelector('.unit')).toBeNull()
  })

  it.each(SUPPORTED_LOCALES)(
    '%s: サマリーの目標・建設コスト・副産物・既保有がリンクになる',
    async (locale) => {
      const container = await render(
        <SummaryPanel solution={ironPlate60} extraction={null} />,
        locale,
      )

      // 目標 + 建設コスト
      expect(links(container, IRON_PLATE_PATH)).toHaveLength(2)
      // 副産物 + 既保有（外部供給）
      expect(links(container, IRON_INGOT_PATH)).toHaveLength(2)
      expect(links(container, IRON_PLATE_PATH)[0]?.textContent).toBe(
        locale === 'ja' ? '鉄板' : 'Iron Plate',
      )
    },
  )
})

describe('レシピモードの詳細ヘッダー', () => {
  it.each(SUPPORTED_LOCALES)(
    '%s: 「アイテムページを開く」リンクを出す（一覧のクリック挙動は変えない）',
    async (locale) => {
      const container = await render(<RecipeBrowser onCreatePlan={() => undefined} />, locale)

      // 選択前はページ遷移リンクを出さない
      expect(container.querySelector('.recipe-browser__item-page-link')).toBeNull()

      await click(
        container.querySelector<HTMLButtonElement>(
          '[data-recipe-browser-item="Desc_IronPlate_C"]',
        )!,
      )

      const link = container.querySelector<HTMLAnchorElement>('.recipe-browser__item-page-link')!
      expect(link.getAttribute('href')).toBe(IRON_PLATE_PATH)
      expect(link.textContent).toBe(getDictionary(locale).itemPage.open)
      // 一覧のボタンは今までどおり画面内の選択（リンクにしない）
      expect(
        container.querySelector('[data-recipe-browser-item="Desc_IronPlate_C"]')?.tagName,
      ).toBe('BUTTON')
    },
  )
})
