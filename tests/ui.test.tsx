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
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App.tsx'
import { planFileName } from '../src/export/excel.ts'
import { SAMPLE_PLANS } from '../src/plan/samples.ts'
import { encodePlan, toPlanSnapshot } from '../src/plan/serialize.ts'
import { createMemoryPlanStorage, setPlanStorage } from '../src/plan/storage.ts'
import { buildingsById } from '../src/data/index.ts'
import { clockedPowerMW, planExtraction } from '../src/solver/index.ts'
import type { InfeasibleResult, Solution } from '../src/solver/index.ts'
import { usePlanner } from '../src/store/planner.ts'
import { BalanceTable } from '../src/ui/BalanceTable.tsx'
import { InfeasiblePanel } from '../src/ui/InfeasiblePanel.tsx'
import { NumberField } from '../src/ui/NumberField.tsx'
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

async function pressKey(
  input: HTMLInputElement,
  key: string,
  init: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  await act(async () => {
    input.dispatchEvent(event)
  })
  return event
}

afterEach(async () => {
  await act(async () => {
    for (const m of mounted.splice(0)) m.unmount()
  })
  document.body.innerHTML = ''
  setPlanStorage(null)
  history.replaceState(null, '', '/') // 共有URLのハッシュを次のテストに持ち越さない
  // 復元テストの入力を次のテストに残さない（残すと裏で求解が走る）
  usePlanner.setState({
    targets: [],
    inputs: [],
    enabledAlternates: {},
    enabledGenerators: {},
    enabledFuels: {},
    powerTargetMW: 0,
    coverFactoryPower: false,
    limitOverrides: {},
    objective: 'resources',
    planName: '',
    loadedTemplateId: null,
  })
})

/** ラベルの一致するボタンを探す（テキストは text.ts と同じ日本語） */
function buttonByText(container: HTMLElement, label: string): HTMLButtonElement {
  return [...container.querySelectorAll('button')].find((b) => b.textContent === label)!
}

/**
 * 鉄板 60/min 相当の解（tests/solver.test.ts の既知値と同じ構成）。
 * 端数のクロック表示を見たいので製作機だけ 3.5 台にしてある。
 */
const smelter = buildingsById.get('Build_SmelterMk1_C')!
const constructor_ = buildingsById.get('Build_ConstructorMk1_C')!
/** 製作機 3.5台分 → 4台を87.5%で回したときの実消費電力 */
const plateClockedPowerMW = clockedPowerMW(4 * 4, 3.5 / 4, constructor_.powerExponent)

const solution: Solution = {
  status: 'optimal',
  steps: [
    {
      recipeId: 'Recipe_IngotIron_C',
      recipeName: { ja: '鉄インゴット', en: 'Iron Ingot' },
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
  totalClockedPowerMW: 12 + plateClockedPowerMW,
  totalClockedPowerRangeMW: {
    minMW: 12 + plateClockedPowerMW,
    maxMW: 12 + plateClockedPowerMW,
  },
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

/** 鉄板を最大化し、鉄インゴットを持ち込んだ解（表示だけを見るための最小フィクスチャ）。 */
const maximized: Solution = {
  ...solution,
  targets: [
    { item: 'Desc_IronPlate_C', requestedPerMin: 1234.56, producedPerMin: 1234.56, maximized: true },
  ],
  maximizedOutput: { item: 'Desc_IronPlate_C', ratePerMin: 1234.56 },
  externalInputs: [
    { item: 'Desc_IronIngot_C', ratePerMin: 90, availablePerMin: 200 },
    { item: 'Desc_Cable_C', ratePerMin: 0, availablePerMin: 10 },
  ],
}

const unboundedMaximize: InfeasibleResult = {
  status: 'infeasible',
  reasons: [
    {
      kind: 'unbounded',
      item: 'Desc_Water_C',
      message: '水 は原料上限が効いていないため最大化できません（上限のない資源だけでいくらでも作れる構成です）',
      advice:
        'サイドバーの「原料上限」で上限のない原料（水など）に上限を入れるか、レート指定に切り替えてください。',
    },
  ],
  message: 'この条件では生産できません。',
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
    const input = container.querySelector<HTMLInputElement>('input[placeholder="未入力なら plan"]')!
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

  it('同じアイテムは二重に追加されず、既存行のレート入力にフォーカスが移る', async () => {
    const container = await render(<App />)
    const search = container.querySelector<HTMLInputElement>('input[type="search"]')!

    /** 候補から「鉄板」ちょうどのものを選ぶ（強化鉄板などと混ざらないように） */
    const pickIronPlate = async (): Promise<void> => {
      await act(async () => {
        typeInto(search, '鉄板')
      })
      const option = [...container.querySelectorAll<HTMLButtonElement>('.suggestions__item')].find(
        (b) => b.querySelector('span')?.textContent === '鉄板',
      )!
      await act(async () => {
        option.click()
      })
    }

    await pickIronPlate()
    expect(usePlanner.getState().targets).toHaveLength(1)
    const rate = container.querySelector<HTMLInputElement>('.target .input--num')!
    await act(async () => {
      typeInto(rate, '120')
    })

    await pickIronPlate()
    // 行は増えず、既に入れたレートも保たれる
    expect(usePlanner.getState().targets).toHaveLength(1)
    expect(usePlanner.getState().targets[0].ratePerMin).toBe(120)
    expect(container.querySelectorAll('.target')).toHaveLength(1)
    // どこへ行ったか分かるように既存行のレート入力へ移動する
    expect(document.activeElement).toBe(container.querySelector('.target .input--num'))
    expect(rate.selectionStart).toBe(0)
    expect(rate.selectionEnd).toBe(rate.value.length)
    // 検索欄はクリアされ、候補は閉じている
    expect(search.value).toBe('')
    expect(container.querySelector('.suggestions')).toBeNull()
  })

  it('目標行を最大化に切り替えるとレート入力が「作れるだけ」に変わる', async () => {
    const container = await render(<App />)
    const search = container.querySelectorAll<HTMLInputElement>('input[type="search"]')[0]!
    await act(async () => {
      typeInto(search, '鉄板')
    })
    const option = [...container.querySelectorAll<HTMLButtonElement>('.suggestions__item')].find(
      (b) => b.querySelector('span')?.textContent === '鉄板',
    )!
    await act(async () => {
      option.click()
    })

    const checkbox = container.querySelector<HTMLInputElement>('.target__mode input')!
    expect(checkbox.checked).toBe(false)
    await act(async () => {
      checkbox.click()
    })

    expect(usePlanner.getState().targets[0].mode).toBe('max')
    expect(container.querySelector('.target--max')).not.toBeNull()
    // 数値入力は消えて「作れるだけ」の表示になる
    expect(container.querySelector('.target .input--num')).toBeNull()
    expect(container.textContent).toContain('作れるだけ')
  })

  it('サイドバーから既にあるアイテムを追加できる', async () => {
    const container = await render(<App />)
    expect(container.textContent).toContain('既にあるアイテム')

    // 2つ目の検索欄が既保有アイテム用（1つ目は目標産出）
    const searches = container.querySelectorAll<HTMLInputElement>('input[type="search"]')
    expect(searches.length).toBeGreaterThanOrEqual(2)
    await act(async () => {
      typeInto(searches[1]!, '鉄のインゴット')
    })
    const option = [...container.querySelectorAll<HTMLButtonElement>('.suggestions__item')].find(
      (b) => b.querySelector('span')?.textContent === '鉄のインゴット',
    )!
    await act(async () => {
      option.click()
    })

    expect(usePlanner.getState().inputs.map((i) => i.item)).toEqual(['Desc_IronIngot_C'])
    expect(container.querySelectorAll('.stock')).toHaveLength(1)
    // 目標産出の行は増えない
    expect(container.querySelectorAll('.target')).toHaveLength(0)
  })
})

describe('数値入力', () => {
  it('全角数字を半角へ直して目標レートに反映する', async () => {
    usePlanner.setState({
      targets: [{ key: 'zenkaku-target', item: 'Desc_IronPlate_C', ratePerMin: 60 }],
    })
    const container = await render(<App />)
    const input = container.querySelector<HTMLInputElement>('.target .input--num')!

    await act(async () => {
      typeInto(input, '３００')
    })

    expect(input.value).toBe('300')
    expect(usePlanner.getState().targets[0]!.ratePerMin).toBe(300)
  })

  it('キーボードフォーカスで現在値を全選択する', async () => {
    usePlanner.setState({
      targets: [{ key: 'select-target', item: 'Desc_IronPlate_C', ratePerMin: 120 }],
    })
    const container = await render(<App />)
    const input = container.querySelector<HTMLInputElement>('.target .input--num')!

    await act(async () => {
      input.focus()
    })
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('未フォーカス時の mouseup だけ現在値を全選択する', async () => {
    const container = await render(<NumberField value={300} onValueChange={() => undefined} />)
    const input = container.querySelector<HTMLInputElement>('input')!
    const select = vi.spyOn(input, 'select')
    const firstMouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true })
    expect(document.activeElement).not.toBe(input)

    await act(async () => {
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
      // jsdom は mousedown の既定動作で focus しないため、ブラウザのイベント順を再現する。
      input.focus()
      select.mockClear()
      input.setSelectionRange(0, 0)
      input.dispatchEvent(firstMouseUp)
    })

    expect(firstMouseUp.defaultPrevented).toBe(true)
    expect(select).toHaveBeenCalledOnce()
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)

    select.mockClear()
    input.setSelectionRange(1, 1)
    const secondMouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true })
    await act(async () => {
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
      input.dispatchEvent(secondMouseUp)
    })

    expect(secondMouseUp.defaultPrevented).toBe(false)
    expect(select).not.toHaveBeenCalled()
    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(1)
  })

  it('keydown を親へ伝えず、既定動作は妨げない', async () => {
    const parentKeyDown = vi.fn()
    const container = await render(
      <div onKeyDown={parentKeyDown}>
        <NumberField value={60} onValueChange={() => undefined} />
      </div>,
    )
    const input = container.querySelector('input')!
    const event = new KeyboardEvent('keydown', {
      key: '3',
      bubbles: true,
      cancelable: true,
    })

    await act(async () => {
      input.dispatchEvent(event)
    })

    expect(parentKeyDown).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('ArrowUp で step 分だけ増やして全選択する', async () => {
    const onValueChange = vi.fn()
    const container = await render(
      <NumberField value={60} step={1} onValueChange={onValueChange} />,
    )
    const input = container.querySelector<HTMLInputElement>('input')!
    input.setSelectionRange(1, 1)

    const event = await pressKey(input, 'ArrowUp')

    expect(event.defaultPrevented).toBe(true)
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith(61)
    expect(input.value).toBe('61')
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('ArrowDown は min で clamp する', async () => {
    const onValueChange = vi.fn()
    const container = await render(
      <NumberField value={0.5} min={0} step={1} onValueChange={onValueChange} />,
    )
    const input = container.querySelector<HTMLInputElement>('input')!

    const event = await pressKey(input, 'ArrowDown')

    expect(event.defaultPrevented).toBe(true)
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith(0)
    expect(input.value).toBe('0')
  })

  it('Shift+ArrowUp は step の10倍だけ増やす', async () => {
    const onValueChange = vi.fn()
    const container = await render(<NumberField value={60} onValueChange={onValueChange} />)
    const input = container.querySelector<HTMLInputElement>('input')!

    const event = await pressKey(input, 'ArrowUp', { shiftKey: true })

    expect(event.defaultPrevented).toBe(true)
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith(70)
    expect(input.value).toBe('70')
  })

  it('解釈できない入力からの step は直近の確定値を使う', async () => {
    const onValueChange = vi.fn()
    const container = await render(
      <NumberField value={60} step={1} onValueChange={onValueChange} />,
    )
    const input = container.querySelector<HTMLInputElement>('input')!

    await act(async () => {
      typeInto(input, '-')
    })
    expect(input.value).toBe('-')
    expect(onValueChange).not.toHaveBeenCalled()

    const event = await pressKey(input, 'ArrowUp')

    expect(event.defaultPrevented).toBe(true)
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith(61)
    expect(input.value).toBe('61')
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('不完全な文字列は store に入れず、blur で直近の値へ戻す', async () => {
    usePlanner.setState({
      targets: [{ key: 'invalid-target', item: 'Desc_IronPlate_C', ratePerMin: 60 }],
    })
    const container = await render(<App />)
    const input = container.querySelector<HTMLInputElement>('.target .input--num')!

    await act(async () => {
      input.focus()
      typeInto(input, '-')
    })
    expect(input.value).toBe('-')
    expect(usePlanner.getState().targets[0]!.ratePerMin).toBe(60)

    await act(async () => {
      input.blur()
    })
    expect(input.value).toBe('60')
    expect(usePlanner.getState().targets[0]!.ratePerMin).toBe(60)
  })

  it('store で clamp された値は blur で確定表示へ戻す', async () => {
    const container = await render(<App />)
    const input = container.querySelector<HTMLInputElement>('.input--num[step="100"]')!

    await act(async () => {
      input.focus()
      typeInto(input, '-1')
    })
    expect(input.value).toBe('-1')
    expect(usePlanner.getState().powerTargetMW).toBe(0)

    await act(async () => {
      input.blur()
    })
    expect(input.value).toBe('0')
    expect(usePlanner.getState().powerTargetMW).toBe(0)
  })
})

describe('空状態のサンプル', () => {
  it('何も入力していないときだけ基本カテゴリの「例から始める」が出る', async () => {
    const container = await render(<App />)
    const text = container.textContent ?? ''
    const basicSamples = SAMPLE_PLANS.filter((sample) => sample.category === 'basic')
    const specialSamples = SAMPLE_PLANS.filter((sample) => sample.category === 'special')
    expect(text).toContain('例から始める')
    for (const sample of basicSamples) {
      expect(text).toContain(sample.title)
      expect(text).toContain(sample.description)
    }
    for (const sample of specialSamples) {
      expect(text).not.toContain(sample.title)
      expect(text).not.toContain(sample.description)
    }
    expect(container.querySelectorAll('.sample')).toHaveLength(basicSamples.length)
  })

  it('サンプルを押すと目標と代替レシピが入る', async () => {
    const container = await render(<App />)
    const sample = SAMPLE_PLANS.find((s) => s.id === 'recycled-plastic')!
    const button = [...container.querySelectorAll<HTMLButtonElement>('.sample')].find((b) =>
      b.textContent?.includes(sample.title),
    )!
    await act(async () => {
      button.click()
    })

    const state = usePlanner.getState()
    expect(state.targets.map((t) => [t.item, t.ratePerMin])).toEqual(sample.snapshot.t)
    expect(Object.keys(state.enabledAlternates).sort()).toEqual([...sample.snapshot.a].sort())
    expect(state.planName).toBe(sample.title)
    // 入力が入ったので例は引っ込む（作業中の画面に割り込まない）
    expect(container.querySelector('.sample')).toBeNull()
  })

  it('既に目標があるときは出さない', async () => {
    usePlanner.setState({
      targets: [{ key: 'sample-test', item: 'Desc_IronPlate_C', ratePerMin: 60 }],
    })
    const container = await render(<App />)
    expect(container.textContent).not.toContain('例から始める')
    expect(container.querySelector('.sample')).toBeNull()
  })

  it('ヘッダーでループに切り替えると特殊テンプレートだけを表示する', async () => {
    const container = await render(<App />)
    const normalButton = buttonByText(container, '通常レシピ')
    const loopButton = buttonByText(container, 'ループ')
    expect(normalButton.getAttribute('aria-pressed')).toBe('true')
    expect(loopButton.getAttribute('aria-pressed')).toBe('false')
    expect(container.textContent).toContain('目標産出')
    expect(container.querySelector('.samples--loop')).toBeNull()

    await act(async () => {
      loopButton.click()
    })

    expect(normalButton.getAttribute('aria-pressed')).toBe('false')
    expect(loopButton.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.sidebar')?.textContent).not.toContain('目標産出')
    expect(container.querySelectorAll('.samples--loop .sample')).toHaveLength(
      SAMPLE_PLANS.filter((sample) => sample.category === 'special').length,
    )
    for (const sample of SAMPLE_PLANS) {
      const sidebarText = container.querySelector('.sidebar')?.textContent ?? ''
      expect(sidebarText.includes(sample.title)).toBe(sample.category === 'special')
    }
    expect(container.querySelector('.sidebar')?.textContent).toContain(
      '編集するには「通常レシピ」に切り替えてください',
    )
  })

  it('ループメニューから読み込むとプランを適用し、ループ表示に留まる', async () => {
    const container = await render(<App />)
    await act(async () => {
      buttonByText(container, 'ループ').click()
    })

    const sample = SAMPLE_PLANS.find((s) => s.id === 'oil-loop-complete')!
    const load = [...container.querySelectorAll<HTMLButtonElement>('.samples--loop .sample')].find(
      (button) => button.textContent?.includes(sample.title),
    )!
    await act(async () => {
      load.click()
    })

    const state = usePlanner.getState()
    expect(state.targets.map((target) => [target.item, target.ratePerMin])).toEqual(
      sample.snapshot.t,
    )
    expect(Object.keys(state.enabledAlternates).sort()).toEqual([...sample.snapshot.a].sort())
    expect(state.planName).toBe(sample.title)
    expect(state.loadedTemplateId).toBe(sample.id)
    expect(state.status).toBe('solving')
    expect(buttonByText(container, 'ループ').getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.samples--loop')).not.toBeNull()
  })

  it('ループモードでは読み込んだ構成の解説を結果タブの上に出し、編集後は隠す', async () => {
    const container = await render(<App />)
    await act(async () => {
      buttonByText(container, 'ループ').click()
    })

    const sample = SAMPLE_PLANS.find((s) => s.id === 'aluminum-water-loop')!
    const load = [...container.querySelectorAll<HTMLButtonElement>('.samples--loop .sample')].find(
      (button) => button.textContent?.includes(sample.title),
    )!
    await act(async () => {
      load.click()
      usePlanner.setState({ status: 'done', result: solution, extraction: null })
    })

    const guide = container.querySelector('.loop-explanation')
    expect(guide?.textContent).toContain('この構成の解説')
    expect(guide?.textContent).toContain('仕組み')
    expect(guide?.textContent).toContain('循環の意味')
    expect(
      guide!.compareDocumentPosition(container.querySelector('.tabs')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    await act(async () => {
      const target = usePlanner.getState().targets[0]!
      usePlanner.getState().updateTarget(target.key, { ratePerMin: target.ratePerMin + 1 })
    })
    expect(usePlanner.getState().loadedTemplateId).toBeNull()
    expect(container.querySelector('.loop-explanation')).toBeNull()
  })

  it('作業中のループテンプレート読み込みは置き換え前に確認する', async () => {
    usePlanner.setState({
      targets: [{ key: 'sample-test', item: 'Desc_IronPlate_C', ratePerMin: 60 }],
    })
    const container = await render(<App />)
    await act(async () => {
      buttonByText(container, 'ループ').click()
    })

    const sample = SAMPLE_PLANS.find((s) => s.id === 'oil-loop-complete')!
    const load = [...container.querySelectorAll<HTMLButtonElement>('.samples--loop .sample')].find(
      (button) => button.textContent?.includes(sample.title),
    )!
    const confirmMock = vi.fn(() => false)
    vi.stubGlobal('confirm', confirmMock)
    await act(async () => {
      load.click()
    })
    expect(confirmMock).toHaveBeenCalledWith(
      `現在の入力を「${sample.title}」で置き換えます。よろしいですか？`,
    )
    expect(usePlanner.getState().targets.map((target) => target.item)).toEqual([
      'Desc_IronPlate_C',
    ])

    vi.stubGlobal('confirm', () => true)
    await act(async () => {
      load.click()
    })
    expect(usePlanner.getState().targets.map((target) => [target.item, target.ratePerMin])).toEqual(
      sample.snapshot.t,
    )
    expect(container.querySelector('.samples--loop .sample')).not.toBeNull()
  })
})

describe('プランの保存・共有', () => {
  it('名前を付けて保存すると一覧に出て、削除できる', async () => {
    setPlanStorage(createMemoryPlanStorage())
    const container = await render(<App />)

    const nameInput = container.querySelector<HTMLInputElement>(
      'input[placeholder="未入力なら plan"]',
    )!
    await act(async () => {
      typeInto(nameInput, '鉄板ライン')
    })
    await act(async () => {
      buttonByText(container, 'このプランを保存').click()
    })

    expect(container.textContent).toContain('「鉄板ライン」を保存しました')
    const item = container.querySelector('.plan')!
    expect(item.textContent).toContain('鉄板ライン')
    expect(buttonByText(container, '読込')).toBeDefined()

    // 削除は確認ダイアログを通す（キャンセルしたら消えない）
    const confirmMock = vi.fn(() => false)
    vi.stubGlobal('confirm', confirmMock)
    await act(async () => {
      buttonByText(container, '削除').click()
    })
    expect(confirmMock).toHaveBeenCalled()
    expect(container.querySelectorAll('.plan').length).toBe(1)

    vi.stubGlobal('confirm', () => true)
    await act(async () => {
      buttonByText(container, '削除').click()
    })
    expect(container.querySelectorAll('.plan').length).toBe(0)
    expect(container.textContent).toContain('保存したプランはまだありません')
    vi.unstubAllGlobals()
  })

  it('共有URLをコピーすると #plan= 付きのURLがクリップボードに入る', async () => {
    setPlanStorage(createMemoryPlanStorage())
    let copied = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void (copied = text) },
    })

    const container = await render(<App />)
    await act(async () => {
      buttonByText(container, '共有URLをコピー').click()
    })

    expect(copied).toContain('#plan=')
    // アドレスバーは触らない（触ると編集後のリロードで古い共有内容に戻ってしまう）
    expect(location.hash).toBe('')
    expect(container.querySelector<HTMLInputElement>('.share-url')?.value).toBe(copied)
    expect(container.textContent).toContain('共有URLをコピーしました')
  })

  it('共有URLで開くと入力が復元される', async () => {
    setPlanStorage(createMemoryPlanStorage())
    const encoded = encodePlan(
      toPlanSnapshot({
        targets: [{ key: 't1', item: 'Desc_IronPlate_C', ratePerMin: 45 }],
        enabledAlternates: {},
        limitOverrides: {},
        objective: 'buildings',
        minerId: usePlanner.getState().minerId,
        planName: '共有されたプラン',
        beltId: usePlanner.getState().beltId,
        pipeId: usePlanner.getState().pipeId,
      }),
    )
    history.replaceState(null, '', `/#plan=${encoded}`)

    const container = await render(<App />)
    expect(container.textContent).toContain('共有URLからプランを復元しました')
    // 復元後はハッシュを外し、内容は自動保存に移してある
    expect(location.hash).toBe('')
    const state = usePlanner.getState()
    expect(state.planName).toBe('共有されたプラン')
    expect(state.targets.map((t) => t.ratePerMin)).toEqual([45])
    expect(state.objective).toBe('buildings')
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

  it('最大化した目標はサマリーで達成レートが分かる', async () => {
    const container = await render(<SummaryPanel solution={maximized} extraction={null} />)
    const text = container.textContent ?? ''
    // 「最大 1,234.56 個/分」相当の一文と、表の要求欄のラベル
    expect(text).toContain('1,234.56')
    expect(text).toContain('鉄板 は最大')
    expect(text).toContain('最大化')
  })

  it('既保有アイテムは投入量と使用量が並び、未使用が分かる', async () => {
    const container = await render(<SummaryPanel solution={maximized} extraction={null} />)
    const text = container.textContent ?? ''
    expect(text).toContain('既保有アイテムの投入')
    expect(text).toContain('200.00') // 投入
    expect(text).toContain('90.00') // 使用
    expect(text).toContain('未使用') // 使われなかった行はラベルで示す
  })

  it('最大化が非有界のときは専用の対処が出る', async () => {
    const container = await render(<InfeasiblePanel result={unboundedMaximize} />)
    const text = container.textContent ?? ''
    expect(text).toContain('最大化できません')
    expect(text).toContain('原料上限')
    // 汎用の「目的関数の重みを見直してください。」ではなく個別の対処に差し替わる
    expect(text).not.toContain('重みを見直して')
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

// ---------------------------------------------------------------------------
// クロック / Somersloop / 床面積
// ---------------------------------------------------------------------------

/** 製作機を250%×2台で回し、Somersloop をフル装着した解（表示だけを見るフィクスチャ）。 */
const overclocked: Solution = {
  ...solution,
  steps: [
    {
      ...solution.steps[1],
      machineCount: 3,
      builtCount: 2,
      clockSpeed: 1.5,
      powerShards: 2,
      somersloops: 2,
      powerMW: 48,
      clockedPowerMW: 30,
      footprintAreaM2: 2 * constructor_.footprint.areaM2,
    },
  ],
  totalPowerMW: 48,
  totalPowerRangeMW: { minMW: 48, maxMW: 48 },
  totalClockedPowerMW: 30,
  totalClockedPowerRangeMW: { minMW: 30, maxMW: 30 },
  maxClock: 2.5,
  totalPowerShards: 2,
  totalSomersloops: 2,
  somersloopLimit: 4,
  totalFootprintAreaM2: 2 * constructor_.footprint.areaM2,
}

describe('クロックとサマースループ', () => {
  it('サイドバーでクロック上限とサマースループ数を変えられる', async () => {
    const container = await render(<App />)
    const range = container.querySelector<HTMLInputElement>('.range')!
    expect(range.value).toBe('100')

    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    await act(async () => {
      setter?.call(range, '250')
      range.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(usePlanner.getState().maxClock).toBe(2.5)

    const sloopInput = container.querySelector<HTMLInputElement>('.field input[step="1"]')!
    await act(async () => {
      typeInto(sloopInput, '8')
    })
    expect(usePlanner.getState().somersloops).toBe(8)

    // 採掘クロックのプルダウンも出ている
    expect(container.textContent).toContain('採掘クロック')
    expect(container.textContent).toContain('クロックとサマースループ')

    usePlanner.setState({ maxClock: 1, somersloops: 0, extractionClock: 1 })
  })

  it('生産ステップ表にクロック・シャード・サマースループの列が出る', async () => {
    const container = await render(<StepsTable solution={overclocked} />)
    const text = container.textContent ?? ''
    expect(text).toContain('2 台 @ 150.0%')
    expect(text).toContain('シャード')
    expect(text).toContain('サマースループ')
    expect(text).toContain('2 個')
    expect(text).toContain('クロック上限 250.0%')
  })

  it('サマースループを使わない解では列を出さない（表を細く保つ）', async () => {
    const container = await render(<StepsTable solution={solution} />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('サマースループ')
    expect(text).not.toContain('シャード')
  })

  it('サマリーにサマースループの使用数と上限が出る', async () => {
    const container = await render(<SummaryPanel solution={overclocked} extraction={null} />)
    const text = container.textContent ?? ''
    expect(text).toContain('サマースループ')
    expect(text).toContain('使用数')
    expect(text).toContain('使用可能数')
    expect(text).toContain('パワーシャード')
  })

  it('サマリーの総電力はクロック適用後で、100%換算も並べて出す', async () => {
    const container = await render(<SummaryPanel solution={overclocked} extraction={null} />)
    const text = container.textContent ?? ''
    expect(text).toContain('30.00') // クロック適用後
    expect(text).toContain('48.00') // 100%換算
    expect(text).toContain('製造（クロック100%換算）')
  })
})

/**
 * 石炭発電機4台（300MW・石炭 60/min・水 180 m³/min）を足した解。
 * 数値は tests/power.test.ts の手計算ケースと同じ。
 */
const coalGenerator = buildingsById.get('Build_GeneratorCoal_C')!
const powered: Solution = {
  ...solution,
  steps: [
    ...solution.steps,
    {
      recipeId: 'power:Build_GeneratorCoal_C:Desc_Coal_C',
      recipeName: { ja: '石炭発電機（石炭）', en: 'Coal-Powered Generator (Coal)' },
      buildingId: 'Build_GeneratorCoal_C',
      buildingName: coalGenerator.name,
      machineCount: 4,
      builtCount: 4,
      clockSpeed: 1,
      powerShards: 0,
      somersloops: 0,
      powerMW: 0,
      clockedPowerMW: 0,
      footprintAreaM2: 4 * coalGenerator.footprint.areaM2,
      inputs: [
        { item: 'Desc_Coal_C', ratePerMin: 60 },
        { item: 'Desc_Water_C', ratePerMin: 180 },
      ],
      outputs: [],
      powerProductionMW: 300,
      fuelItem: 'Desc_Coal_C',
    },
  ],
  powerGeneration: {
    targetMW: 300,
    coverFactoryPower: true,
    totalMW: 300,
    totalGeneratorCount: 4,
    totalGeneratorMachineCount: 4,
    fuelUsage: [{ item: 'Desc_Coal_C', ratePerMin: 60 }],
    factoryPowerMW: 26,
    netMW: 274,
  },
}

describe('発電計画', () => {
  it('サイドバーに発電方式・目標発電量・自給の入力が出て、store に反映される', async () => {
    const container = await render(<App />)
    const text = container.textContent ?? ''
    expect(text).toContain('発電計画')
    expect(text).toContain('石炭発電機')
    expect(text).toContain('燃料式発電機')
    expect(text).toContain('原子力発電所')
    expect(text).toContain('工場の消費電力ぶんを賄う')

    // 既定は「発電方式すべてオフ」＝ 発電計画なし（従来と同じ挙動）
    expect(usePlanner.getState().enabledGenerators).toEqual({})
    expect(usePlanner.getState().powerTargetMW).toBe(0)
    expect(usePlanner.getState().coverFactoryPower).toBe(false)

    const checkboxes = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
    const coal = checkboxes[0]!
    await act(async () => {
      coal.click()
    })
    expect(usePlanner.getState().enabledGenerators).toEqual({ Build_GeneratorCoal_C: true })

    // 発電計画パネルの数値入力は目標発電量だけ
    const targetInput = container.querySelector<HTMLInputElement>('.input--num[step="100"]')!
    await act(async () => {
      typeInto(targetInput, '300')
    })
    expect(usePlanner.getState().powerTargetMW).toBe(300)

    usePlanner.setState({ enabledGenerators: {}, powerTargetMW: 0, coverFactoryPower: false })
  })

  it('発電方式をオンにすると燃料のチェックリストが開く（既定は全部オフ）', async () => {
    const container = await render(<App />)
    // オフのうちは燃料の一覧を出さない（サイドバーを長くしないため）
    expect(container.textContent ?? '').not.toContain('使う燃料')

    const coalCheckbox = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')][0]!
    await act(async () => {
      coalCheckbox.click()
    })
    const text = container.textContent ?? ''
    expect(text).toContain('使う燃料')
    expect(text).toContain('圧縮石炭')
    expect(text).toContain('石油コークス')
    // 既定は全燃料オフ（実プレイでは1方式に1種類しか流さない）。
    // 空の記録を明示的に持つ（キー無し = v5 以前の「全燃料許可」と区別するため）
    expect(usePlanner.getState().enabledFuels).toEqual({ Build_GeneratorCoal_C: {} })
    const fuelBoxes = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].slice(1, 4)
    expect(fuelBoxes.some((b) => b.checked)).toBe(false)
    expect(container.textContent ?? '').toContain('燃料が選ばれていません')

    usePlanner.setState({ enabledGenerators: {}, enabledFuels: {}, powerTargetMW: 0 })
  })

  it('IME 確定時に全角の目標発電量を store に反映する', async () => {
    const container = await render(<App />)
    const targetInput = container.querySelector<HTMLInputElement>('.input--num[step="100"]')!

    await act(async () => {
      targetInput.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
      typeInto(targetInput, '３００')
    })
    expect(targetInput.value).toBe('３００')
    expect(usePlanner.getState().powerTargetMW).toBe(0)

    await act(async () => {
      targetInput.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '３００' }),
      )
    })
    expect(targetInput.value).toBe('300')
    expect(usePlanner.getState().powerTargetMW).toBe(300)
  })

  it('燃料を選んでから全部オフに戻すと、その方式は使わない旨を出す', async () => {
    const container = await render(<App />)
    const coalCheckbox = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')][0]!
    await act(async () => {
      coalCheckbox.click()
    })

    // 石炭発電機の燃料チェックは、方式のチェックのすぐ後ろに並ぶ（3種）
    const fuelBoxes = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].slice(1, 4)
    for (const box of fuelBoxes) {
      await act(async () => {
        box.click()
      })
    }
    expect(fuelBoxes.every((b) => b.checked)).toBe(true)
    for (const box of fuelBoxes) {
      await act(async () => {
        box.click()
      })
    }
    expect(usePlanner.getState().enabledFuels).toEqual({ Build_GeneratorCoal_C: {} })
    expect(container.textContent ?? '').toContain('燃料が選ばれていません')

    usePlanner.setState({ enabledGenerators: {}, enabledFuels: {}, powerTargetMW: 0 })
  })

  it('燃料を1つだけ選ぶと store に記録される（全部オンにしても記録は残る）', async () => {
    const container = await render(<App />)
    const coalCheckbox = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')][0]!
    await act(async () => {
      coalCheckbox.click()
    })
    const fuelBoxes = [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].slice(1, 4)
    await act(async () => {
      fuelBoxes[0]!.click()
    })
    expect(Object.keys(usePlanner.getState().enabledFuels)).toEqual(['Build_GeneratorCoal_C'])
    expect(usePlanner.getState().enabledFuels.Build_GeneratorCoal_C).toEqual({ Desc_Coal_C: true })
    // 全部オンにしても記録は消さない（キー無し＝v5互換の全許可、とは別物なので）
    for (const box of fuelBoxes.slice(1)) {
      await act(async () => {
        box.click()
      })
    }
    expect(Object.keys(usePlanner.getState().enabledFuels.Build_GeneratorCoal_C!).sort()).toEqual(
      ['Desc_Coal_C', 'Desc_CompactedCoal_C', 'Desc_PetroleumCoke_C'],
    )

    usePlanner.setState({ enabledGenerators: {}, enabledFuels: {}, powerTargetMW: 0 })
  })

  it('サマリーに総発電量・目標・燃料の消費が出る', async () => {
    const container = await render(<SummaryPanel solution={powered} extraction={null} />)
    const text = container.textContent ?? ''
    expect(text).toContain('総発電量')
    expect(text).toContain('300.00')
    expect(text).toContain('目標')
    expect(text).toContain('発電機（建てる台数）')
    expect(text).toContain('燃料の消費')
    expect(text).toContain('石炭')
    expect(text).toContain('60.00')
  })

  it('発電しない解ではサマリーに発電のカードを出さない', async () => {
    const container = await render(<SummaryPanel solution={solution} extraction={null} />)
    expect(container.textContent ?? '').not.toContain('総発電量')
  })

  it('生産ステップ表に発電機の行と発電量の列が出る', async () => {
    const container = await render(<StepsTable solution={powered} />)
    const text = container.textContent ?? ''
    expect(text).toContain('石炭発電機')
    expect(text).toContain('発電量 (MW)')
    expect(text).toContain('+300.00')
    // 燃料と水が投入として並ぶ
    expect(text).toContain('石炭')
    expect(text).toContain('水')
  })

  it('発電しない解では発電量の列を出さない（表を細く保つ）', async () => {
    const container = await render(<StepsTable solution={solution} />)
    expect(container.textContent ?? '').not.toContain('発電量')
  })
})

describe('発電を隠す（表示だけの絞り込み）', () => {
  it('発電計画のある解ではトグルが出て、既定（オフ）では発電機の行も出す', async () => {
    const container = await render(<StepsTable solution={powered} />)
    const text = container.textContent ?? ''
    expect(text).toContain('発電を隠す')
    expect(text).toContain('石炭発電機')
    expect(text).not.toContain('非表示中')
    const box = container.querySelector<HTMLInputElement>('.power-filter input[type="checkbox"]')
    expect(box).not.toBeNull()
    expect(box!.checked).toBe(false)
  })

  it('オンにすると発電機の行と発電量の列が消え、非表示中の注記が出る', async () => {
    const container = await render(<StepsTable solution={powered} hidePower />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('石炭発電機')
    expect(text).not.toContain('発電量')
    expect(text).toContain('1 ステップ（発電関連）を非表示中')
    // 戻せるようにトグル自体は残す
    expect(text).toContain('発電を隠す')
    // 工場側の行はそのまま
    expect(text).toContain('鉄インゴット')
    expect(text).toContain('鉄板')
  })

  it('チェックすると onHidePowerChange(true) を呼ぶ', async () => {
    const onChange = vi.fn()
    const container = await render(
      <StepsTable solution={powered} onHidePowerChange={onChange} />,
    )
    const box = container.querySelector<HTMLInputElement>('.power-filter input[type="checkbox"]')!
    await act(async () => {
      box.click()
    })
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('発電計画が無効な解ではトグルを出さない', async () => {
    const container = await render(<StepsTable solution={solution} />)
    expect(container.textContent ?? '').not.toContain('発電を隠す')
    expect(container.querySelector('.power-filter')).toBeNull()
  })
})

describe('床面積の概算', () => {
  it('サマリーに概算床面積とファウンデーション枚数が出る', async () => {
    const container = await render(<SummaryPanel solution={solution} extraction={null} />)
    const text = container.textContent ?? ''
    expect(text).toContain('概算床面積')
    // 製錬炉3台(50m²) + 製作機4台(80m²) = 470m² × 1.5 = 705m² → 705/64 = 12枚
    expect(text).toContain('705')
    expect(text).toContain('ファウンデーション 12 枚')
    expect(text).toContain('8m × 8m')
    // 概算であることを明記する
    expect(text).toContain('概算です')
  })
})
