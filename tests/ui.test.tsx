// @vitest-environment jsdom
/**
 * 画面の軽いレンダリングテスト。
 * ブラウザ版 glpk.js は Web Worker で動き jsdom では起動できないので、
 * ここでは「ソルバーを呼ばずに」解のフィクスチャを描画して確認する。
 * 求解そのものの検証は tests/solver.test.ts（Node 環境）が担当する。
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App.tsx'
import { planFileName } from '../src/export/excel.ts'
import { planExtraction } from '../src/solver/index.ts'
import type { InfeasibleResult, Solution } from '../src/solver/index.ts'
import { usePlanner } from '../src/store/planner.ts'
import { BalanceTable } from '../src/ui/BalanceTable.tsx'
import { InfeasiblePanel } from '../src/ui/InfeasiblePanel.tsx'
import { ResourcesTable } from '../src/ui/ResourcesTable.tsx'
import { ResultView } from '../src/ui/ResultView.tsx'
import { StepsTable } from '../src/ui/StepsTable.tsx'
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

/**
 * React の制御コンポーネントに入力する。
 * value を直接代入すると React の value トラッカーが変化を検知しないので、
 * プロトタイプ側の setter を使ってから input イベントを飛ばす。
 */
function typeInto(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

afterEach(async () => {
  await act(async () => {
    for (const m of mounted.splice(0)) m.unmount()
  })
  document.body.innerHTML = ''
})

/**
 * 鉄板 60/min 相当の解（tests/solver.test.ts の既知値と同じ構成）。
 * 端数のクロック表示を見たいので製作機だけ 3.5 台にしてある。
 */
const solution: Solution = {
  status: 'optimal',
  steps: [
    {
      recipeId: 'Recipe_IngotIron_C',
      recipeName: { ja: '鉄インゴット', en: 'Iron Ingot' },
      buildingId: 'Build_SmelterMk1_C',
      buildingName: { ja: '製錬炉', en: 'Smelter' },
      machineCount: 3,
      clockSpeed: 1,
      powerMW: 12,
      inputs: [{ item: 'Desc_OreIron_C', ratePerMin: 90 }],
      outputs: [{ item: 'Desc_IronIngot_C', ratePerMin: 90 }],
    },
    {
      recipeId: 'Recipe_IronPlate_C',
      recipeName: { ja: '鉄板', en: 'Iron Plate' },
      buildingId: 'Build_ConstructorMk1_C',
      buildingName: { ja: '製作機', en: 'Constructor' },
      machineCount: 3.5,
      clockSpeed: 1,
      powerMW: 14,
      inputs: [{ item: 'Desc_IronIngot_C', ratePerMin: 105 }],
      outputs: [{ item: 'Desc_IronPlate_C', ratePerMin: 70 }],
    },
  ],
  rawResources: [
    { item: 'Desc_OreIron_C', ratePerMin: 90, limitPerMin: 92_100, usageRatio: 90 / 92_100 },
  ],
  externalInputs: [],
  byproducts: [{ item: 'Desc_IronPlate_C', ratePerMin: 10 }],
  targets: [{ item: 'Desc_IronPlate_C', requestedPerMin: 60, producedPerMin: 70 }],
  itemBalance: [
    {
      item: 'Desc_IronIngot_C',
      producedPerMin: 90,
      consumedPerMin: 105,
      suppliedPerMin: 0,
      netPerMin: -15,
    },
    {
      item: 'Desc_IronPlate_C',
      producedPerMin: 70,
      consumedPerMin: 0,
      suppliedPerMin: 0,
      netPerMin: 70,
    },
    {
      item: 'Desc_OreIron_C',
      producedPerMin: 0,
      consumedPerMin: 90,
      suppliedPerMin: 90,
      netPerMin: 0,
    },
  ],
  totalPowerMW: 26,
  totalPowerRangeMW: { minMW: 26, maxMW: 26 },
  totalMachineCount: 6.5,
  totalBuildingCount: 7,
  totalBuildCost: [{ item: 'Desc_IronPlate_C', amount: 30 }],
  sinkPointsPerMin: 120,
  objectiveValue: 90,
}

const infeasible: InfeasibleResult = {
  status: 'infeasible',
  reasons: [
    {
      kind: 'resourceLimit',
      item: 'Desc_OreIron_C',
      limitPerMin: 100,
      requiredPerMin: 150,
      shortfallPerMin: 50,
      message: '鉄鉱石 が足りません（上限 100 /min に対し 150 /min 必要。不足 50 /min）',
    },
  ],
  message: 'この条件では生産できません。',
}

describe('画面の骨格', () => {
  it('タイトルとサイドバーの各セクションが出る', async () => {
    const container = await render(<App />)
    const text = container.textContent ?? ''
    expect(text).toContain('Satisfactory 生産計画ツール')
    expect(text).toContain('目標産出')
    expect(text).toContain('目的関数')
    expect(text).toContain('資源効率')
    expect(text).toContain('代替レシピ')
    expect(text).toContain('原料上限')
    expect(text).toContain('採鉱機 Mk.3')
    // 目標が空なので結果は出ない
    expect(text).toContain('目標を追加すると計算します')
  })

  it('サイドバー下部に物流の選択と Excel 出力がある', async () => {
    const container = await render(<App />)
    const text = container.textContent ?? ''
    expect(text).toContain('物流')
    expect(text).toContain('ベルト')
    expect(text).toContain('パイプ')
    expect(text).toContain('Excel出力')
    expect(text).toContain('プラン名')

    // 既定は最速の Mk（本数が最小になる）
    const selects = [...container.querySelectorAll<HTMLSelectElement>('select')]
    const beltSelect = selects.find((s) => s.value.includes('ConveyorBelt'))!
    expect(beltSelect.value).toBe(usePlanner.getState().beltId)
    expect(beltSelect.options.length).toBe(6)
  })

  it('解が無いときは Excelダウンロードが押せない', async () => {
    const container = await render(<App />)
    const button = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === 'Excelダウンロード',
    )!
    expect(button).toBeDefined()
    expect(button.disabled).toBe(true)
    expect(container.textContent).toContain('解が出てからダウンロードできます')
  })

  it('プラン名の入力がストアに入る（ファイル名に使われる）', async () => {
    const container = await render(<App />)
    const input = container.querySelector<HTMLInputElement>('input[type="text"]')!
    await act(async () => {
      typeInto(input, '鉄板ライン')
    })
    expect(usePlanner.getState().planName).toBe('鉄板ライン')
    expect(planFileName(usePlanner.getState().planName, new Date(2026, 7, 7))).toBe(
      'satisfactory-plan_鉄板ライン_20260807.xlsx',
    )
  })

  it('アイテム検索が日本語名でインクリメンタルに絞り込める', async () => {
    const container = await render(<App />)
    const search = container.querySelector<HTMLInputElement>('input[type="search"]')!
    await act(async () => {
      typeInto(search, '鉄板')
    })
    const options = [...container.querySelectorAll('.suggestions__item')].map((b) => b.textContent)
    expect(options.length).toBeGreaterThan(0)
    expect(options.every((label) => label?.includes('鉄板'))).toBe(true)
  })
})

describe('結果テーブル', () => {
  it('サマリーに電力の内訳・建物数・シンクポイントが出る', async () => {
    const extraction = planExtraction(solution)
    const container = await render(<SummaryPanel solution={solution} extraction={extraction} />)
    const text = container.textContent ?? ''
    expect(text).toContain('総消費電力')
    expect(text).toContain('26.00') // 製造
    expect(text).toContain('製造')
    expect(text).toContain('採掘')
    expect(text).toContain('6.5000') // 稼働台数（小数4位）
    expect(text).toContain('120') // シンクポイント
    expect(text).toContain('建設コスト')
  })

  it('生産ステップが機械種別ごとにまとまり、端数はクロック案になる', async () => {
    const container = await render(<StepsTable solution={solution} />)
    const text = container.textContent ?? ''
    expect(text).toContain('製錬炉')
    expect(text).toContain('製作機')
    expect(text).toContain('鉄インゴット')
    // 3.5台 → 4台を87.5%で回す案
    expect(text).toContain('4 台 @ 87.5%')
    expect(container.querySelectorAll('table').length).toBe(2)
  })

  it('原料表に上限比率と採掘機の台数・純度別ノードが出る', async () => {
    const extraction = planExtraction(solution)
    const container = await render(
      <ResourcesTable solution={solution} extraction={extraction} />,
    )
    const text = container.textContent ?? ''
    expect(text).toContain('鉄鉱石')
    expect(text).toContain('採鉱機 Mk.3')
    expect(text).toContain('高純度')
    expect(text).toContain('0.1%') // 90 / 92,100
  })

  it('アイテム収支は色だけでなくラベルでも過不足が分かる', async () => {
    const container = await render(<BalanceTable solution={solution} />)
    const text = container.textContent ?? ''
    expect(text).toContain('余剰')
    expect(text).toContain('不足')
    expect(text).toContain('均衡')
    expect(container.querySelector('.is-shortage')).not.toBeNull()
    expect(container.querySelector('.is-surplus')).not.toBeNull()
  })

  it('結果タブに「フローチャート」がある（中身は遅延読み込み）', async () => {
    const previous = usePlanner.getState()
    usePlanner.setState({ status: 'done', result: solution, extraction: planExtraction(solution) })
    try {
      const container = await render(<ResultView />)
      const tabs = [...container.querySelectorAll('[role="tab"]')].map((b) => b.textContent)
      expect(tabs).toEqual([
        'サマリー',
        '生産ステップ',
        '原料',
        'アイテム収支',
        'フローチャート',
      ])
    } finally {
      usePlanner.setState({
        status: previous.status,
        result: previous.result,
        extraction: previous.extraction,
      })
    }
  })

  it('実行不能のときは原因と対処が日本語で出る', async () => {
    const container = await render(<InfeasiblePanel result={infeasible} />)
    const text = container.textContent ?? ''
    expect(text).toContain('この条件では生産できません')
    expect(text).toContain('原料不足')
    expect(text).toContain('鉄鉱石 が足りません')
    expect(text).toContain('原料上限を上げるか、目標レートを下げてください。')
  })
})
