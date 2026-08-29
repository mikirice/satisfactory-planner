// @vitest-environment jsdom
/**
 * 建設リストの画面（src/ui/BuildListView.tsx）と進捗の保存（src/plan/build-progress.ts）。
 *
 * 見たいのは「ゲームの隣でカウンターを押す」操作の往復。
 *   カウンター（+/−）とチェックの連動 / 進捗バーの数値 / localStorage への保存と復元 /
 *   リセットの確認ダイアログ / 壊れた保存値を握り潰すこと
 *
 * Phase 2 で足した分:
 *   完了の波紋（型 D2。連打で重ねない・外したら出さない・Reduce Motion で描かない）/
 *   画面スリープ抑止（対応ブラウザだけ・復帰時に取り直す・拒否されたら戻す）/
 *   進捗キーが「解に効く入力」だけで決まること（名前を変えても続く）
 *
 * ソルバーは jsdom で動かせないので、解は tests/ui.test.tsx と同じ作りのフィクスチャを使う。
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildingsById } from '../src/data/index.ts'
import {
  BUILD_PROGRESS_KEY_PREFIX,
  buildProgressKey,
  loadBuildProgress,
  planHash,
  planProgressHash,
  saveBuildProgress,
} from '../src/plan/build-progress.ts'
import type { PlanSnapshot } from '../src/plan/serialize.ts'
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

/**
 * Node 25 は空オブジェクトの localStorage をグローバルに置く（tests/locale.test.tsx と同じ事情）。
 * 保存を確かめたいので最小実装を挿す。
 */
function installMemoryLocalStorage(): Map<string, string> {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string): string | null => store.get(key) ?? null,
      setItem: (key: string, value: string): void => void store.set(key, String(value)),
      removeItem: (key: string): void => void store.delete(key),
      clear: (): void => store.clear(),
      key: (index: number): string | null => [...store.keys()][index] ?? null,
      get length(): number {
        return store.size
      },
    },
  })
  return store
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')

/**
 * 動きを減らす設定を強制する。jsdom の matchMedia は常に matches:false なので、
 * Reduce Motion 側の分岐はここで作る（src/ui/responsive.ts が読む条件）。
 */
function stubReducedMotion(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: (): void => undefined,
    removeEventListener: (): void => undefined,
  }))
}

type FakeSentinel = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: string, listener: () => void) => void
  /** OS 側がロックを外したときの通知（タブを隠す・画面が消える） */
  emitRelease: () => void
}

/** navigator.wakeLock を差し込む。jsdom には実装が無いので、あるブラウザを作って試す。 */
function installWakeLock(behaviour: 'grant' | 'reject' = 'grant') {
  const sentinels: FakeSentinel[] = []
  const request = vi.fn(async (): Promise<FakeSentinel> => {
    if (behaviour === 'reject') throw new Error('wake lock denied')
    const listeners: (() => void)[] = []
    const sentinel: FakeSentinel = {
      released: false,
      release: vi.fn(async (): Promise<void> => {
        sentinel.released = true
      }),
      addEventListener: (type, listener) => {
        if (type === 'release') listeners.push(listener)
      },
      emitRelease: () => {
        sentinel.released = true
        for (const listener of listeners) listener()
      },
    }
    sentinels.push(sentinel)
    return sentinel
  })
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } })
  return { request, sentinels }
}

afterEach(async () => {
  await act(async () => {
    for (const m of mounted.splice(0)) m.unmount()
  })
  document.body.innerHTML = ''
  if (originalLocalStorage === undefined) Reflect.deleteProperty(window, 'localStorage')
  else Object.defineProperty(window, 'localStorage', originalLocalStorage)
  Reflect.deleteProperty(navigator, 'wakeLock')
  vi.unstubAllGlobals()
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

const counterButtons = (row: HTMLElement): HTMLButtonElement[] => [
  ...row.querySelectorAll<HTMLButtonElement>('.build-counter__button'),
]

const checkbox = (row: HTMLElement): HTMLInputElement =>
  row.querySelector<HTMLInputElement>('input[type="checkbox"]')!

const overallText = (container: HTMLElement): string =>
  container.querySelector('.build-progress__count')?.textContent ?? ''

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click()
  })
}

describe('建設リストの表示', () => {
  it('セクションと工程が依存順に並び、台数・クロック・ベルト等級が出る', async () => {
    const container = await render(
      <BuildListView
        solution={solution}
        extraction={planExtraction(solution)}
        planHash="plan-a"
      />,
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
    // 全体は 採掘1台 + 製錬炉3台 + 製作機4台
    expect(overallText(container)).toContain('0 / 8')
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
    const container = await render(
      <BuildListView solution={powered} extraction={null} planHash="plan-power" />,
    )
    const text = container.textContent ?? ''

    expect(text).toContain('発電')
    expect(text).toContain('石炭発電機')
    expect(text).toContain('燃料: 石炭')
    expect(text).toContain('300.00 MW')
    // 水 180 m³/min はパイプ Mk.1（300 m³/min）で1本
    expect(text).toContain('パイプラインMk.1')
    expect(text).not.toContain('power:Build_GeneratorCoal_C')
    expect(rows(container).at(-1)?.textContent).toContain('建てた 0 / 4')
  })

  it('建てるものが無ければ空状態を出す', async () => {
    const empty: Solution = { ...solution, steps: [], totalBuildingCount: 0 }
    const container = await render(
      <BuildListView solution={empty} extraction={null} planHash="plan-empty" />,
    )
    expect(container.textContent).toContain('建てるものがありません')
  })
})

describe('カウンターとチェック', () => {
  it('+ / − で台数が増減し、上限・下限で止まる', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-counter" />,
    )
    // 製錬炉（3台）の行
    const row = rows(container)[0]!
    const [minus, plus] = counterButtons(row)

    expect(row.textContent).toContain('建てた 0 / 3')
    expect(minus!.disabled).toBe(true)

    await click(plus!)
    expect(rows(container)[0]!.textContent).toContain('建てた 1 / 3')
    expect(overallText(container)).toContain('1 / 7')

    await click(counterButtons(rows(container)[0]!)[0]!)
    expect(rows(container)[0]!.textContent).toContain('建てた 0 / 3')
    // 下限で止まる（マイナスにならない）
    expect(counterButtons(rows(container)[0]!)[0]!.disabled).toBe(true)

    for (let i = 0; i < 3; i += 1) await click(counterButtons(rows(container)[0]!)[1]!)
    expect(rows(container)[0]!.textContent).toContain('建てた 3 / 3')
    // 上限に達したら + は押せない
    expect(counterButtons(rows(container)[0]!)[1]!.disabled).toBe(true)
  })

  it('全数に達するとチェックが入り、チェックを押すと全数 / 0 台に切り替わる', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-check" />,
    )
    const row = () => rows(container)[0]!

    expect(checkbox(row()).checked).toBe(false)
    for (let i = 0; i < 3; i += 1) await click(counterButtons(row())[1]!)
    expect(checkbox(row()).checked).toBe(true)
    expect(row().className).toContain('build-item--done')

    // チェックを外すと 0 台に戻る
    await click(checkbox(row()))
    expect(checkbox(row()).checked).toBe(false)
    expect(row().textContent).toContain('建てた 0 / 3')

    // チェックを直接押すと全数完了
    await click(checkbox(row()))
    expect(row().textContent).toContain('建てた 3 / 3')
    expect(overallText(container)).toContain('3 / 7')
  })

  it('全部建てると全体の進捗が満了になる', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-full" />,
    )
    for (const row of rows(container)) await click(checkbox(row))

    expect(overallText(container)).toContain('7 / 7')
    const bar = container.querySelector('.build-bar')!
    expect(bar.getAttribute('aria-valuenow')).toBe('7')
    expect(bar.getAttribute('aria-valuemax')).toBe('7')
    expect(container.querySelector<HTMLElement>('.build-bar__fill')?.style.width).toBe('100%')
  })
})

describe('進捗の保存', () => {
  it('localStorage に書かれ、開き直すと復元される', async () => {
    const store = installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-save" />,
    )
    await click(counterButtons(rows(container)[0]!)[1]!)

    const raw = store.get(buildProgressKey('plan-save'))
    expect(raw).toBeDefined()
    expect(JSON.parse(raw!)).toEqual({ 'make:Recipe_IngotIron_C': 1 })
    expect(buildProgressKey('plan-save').startsWith(BUILD_PROGRESS_KEY_PREFIX)).toBe(true)

    // 同じ計画をもう一度開く（＝別のマウント）と続きから
    const reopened = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-save" />,
    )
    expect(rows(reopened)[0]!.textContent).toContain('建てた 1 / 3')

    // 別の計画（ハッシュが違う）はまっさら
    const other = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-other" />,
    )
    expect(rows(other)[0]!.textContent).toContain('建てた 0 / 3')
  })

  it('「進捗をリセット」は確認してから消す', async () => {
    const store = installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-reset" />,
    )
    await click(checkbox(rows(container)[0]!))
    expect(overallText(container)).toContain('3 / 7')

    const confirmMock = vi.fn(() => false)
    vi.stubGlobal('confirm', confirmMock)
    await click([...container.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === '進捗をリセット',
    )!)
    expect(confirmMock).toHaveBeenCalledWith('建設の進捗をすべて消します。よろしいですか？')
    expect(overallText(container)).toContain('3 / 7')

    vi.stubGlobal('confirm', () => true)
    await click([...container.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === '進捗をリセット',
    )!)
    expect(overallText(container)).toContain('0 / 7')
    expect(store.has(buildProgressKey('plan-reset'))).toBe(false)
  })

  it('localStorage が無い環境でも操作できる（保存だけ諦める）', async () => {
    Reflect.deleteProperty(window, 'localStorage')
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-nostorage" />,
    )
    await click(counterButtons(rows(container)[0]!)[1]!)
    expect(rows(container)[0]!.textContent).toContain('建てた 1 / 3')
  })
})

describe('進捗データの検証（build-progress.ts）', () => {
  it('計画ハッシュは同じ文字列から同じ値・違う文字列で別の値になる', () => {
    expect(planHash('abc')).toBe(planHash('abc'))
    expect(planHash('abc')).not.toBe(planHash('abd'))
    expect(planHash('')).toMatch(/^[0-9a-z]+$/)
  })

  it('壊れた保存値・不正な台数は無かったことにする', () => {
    const store = installMemoryLocalStorage()

    store.set(buildProgressKey('broken'), '{ this is not json')
    expect(loadBuildProgress('broken')).toEqual({})

    store.set(buildProgressKey('array'), '[1,2,3]')
    expect(loadBuildProgress('array')).toEqual({})

    store.set(
      buildProgressKey('mixed'),
      JSON.stringify({ ok: 2, negative: -1, text: 'x', zero: 0, fraction: 2.7 }),
    )
    expect(loadBuildProgress('mixed')).toEqual({ ok: 2, fraction: 2 })

    // 0台だけになったらキーごと消す（保存を膨らませない）
    saveBuildProgress('mixed', { ok: 0 })
    expect(store.has(buildProgressKey('mixed'))).toBe(false)
  })

  it('保存キーは名前空間つきで、計画ごとに分かれる', () => {
    expect(buildProgressKey('abc')).toBe(`${BUILD_PROGRESS_KEY_PREFIX}abc`)
    expect(buildProgressKey('abc')).not.toBe(buildProgressKey('abd'))
  })
})

// ---------------------------------------------------------------------------
// 進捗キーは「解に効く入力」だけで決まる（Phase 2）
// ---------------------------------------------------------------------------

const snapshot = (patch: Partial<PlanSnapshot> = {}): PlanSnapshot => ({
  v: 6,
  n: '鉄板ライン',
  t: [['Desc_IronPlate_C', 60]],
  a: [],
  l: {},
  o: 'resources',
  m: 'Build_MinerMk3_C',
  b: 'Build_ConveyorBeltMk6_C',
  p: 'Build_PipelineMK2_C',
  ...patch,
})

describe('進捗キーの決め方（planProgressHash）', () => {
  it('プラン名を変えても・ベルトの表示等級を変えても同じキー', () => {
    const base = planProgressHash(snapshot())

    expect(planProgressHash(snapshot({ n: '主力ライン（改）' }))).toBe(base)
    expect(planProgressHash(snapshot({ n: '' }))).toBe(base)
    expect(planProgressHash(snapshot({ b: 'Build_ConveyorBeltMk1_C' }))).toBe(base)
    expect(planProgressHash(snapshot({ p: 'Build_Pipeline_C' }))).toBe(base)
  })

  it('解に効く入力を変えたらキーが変わる（進捗はまっさらになる）', () => {
    const base = planProgressHash(snapshot())

    expect(planProgressHash(snapshot({ t: [['Desc_IronPlate_C', 120]] }))).not.toBe(base)
    expect(planProgressHash(snapshot({ t: [['Desc_IronRod_C', 60]] }))).not.toBe(base)
    expect(planProgressHash(snapshot({ a: ['Recipe_Alternate_CoatedIronPlate_C'] }))).not.toBe(base)
    expect(planProgressHash(snapshot({ c: 2.5 }))).not.toBe(base)
    expect(planProgressHash(snapshot({ o: 'power' }))).not.toBe(base)
    expect(planProgressHash(snapshot({ l: { Desc_OreIron_C: 120 } }))).not.toBe(base)
  })

  it('キーの並び順が違うだけの同じ計画は同じキー', () => {
    const ordered: PlanSnapshot = {
      v: 6,
      n: '鉄板ライン',
      t: [['Desc_IronPlate_C', 60]],
      a: [],
      l: {},
      o: 'resources',
      m: 'Build_MinerMk3_C',
      b: 'Build_ConveyorBeltMk6_C',
      p: 'Build_PipelineMK2_C',
      s: 4,
    }
    const shuffled = {
      s: 4,
      p: 'Build_PipelineMK2_C',
      b: 'Build_ConveyorBeltMk6_C',
      m: 'Build_MinerMk3_C',
      o: 'resources',
      l: {},
      a: [],
      t: [['Desc_IronPlate_C', 60]],
      n: '鉄板ライン',
      v: 6,
    } as PlanSnapshot

    expect(planProgressHash(shuffled)).toBe(planProgressHash(ordered))
  })

  it('進捗は名前を変えた計画でも続きから消し込める', async () => {
    const store = installMemoryLocalStorage()
    const before = planProgressHash(snapshot())
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash={before} />,
    )
    await click(counterButtons(rows(container)[0]!)[1]!)
    expect(store.has(buildProgressKey(before))).toBe(true)

    // 名前だけ変えた同じ計画をもう一度開く
    const renamed = planProgressHash(snapshot({ n: '別名にした鉄板ライン' }))
    const reopened = await render(
      <BuildListView solution={solution} extraction={null} planHash={renamed} />,
    )
    expect(rows(reopened)[0]!.textContent).toContain('建てた 1 / 3')

    // 目標レートを変えたら別の計画として最初から
    const retargeted = planProgressHash(snapshot({ t: [['Desc_IronPlate_C', 120]] }))
    const other = await render(
      <BuildListView solution={solution} extraction={null} planHash={retargeted} />,
    )
    expect(rows(other)[0]!.textContent).toContain('建てた 0 / 3')
  })
})

// ---------------------------------------------------------------------------
// 完了の波紋（design-spells 型 D2）
// ---------------------------------------------------------------------------

const ripples = (container: HTMLElement): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('.build-item__ripple'),
]

describe('完了の波紋', () => {
  it('完了した瞬間だけ1つ出て、外すと消える', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-ripple" />,
    )
    const row = () => rows(container)[0]!

    expect(ripples(container)).toHaveLength(0)

    await click(checkbox(row()))
    expect(ripples(container)).toHaveLength(1)

    // 外す操作には動きを付けない
    await click(checkbox(row()))
    expect(ripples(container)).toHaveLength(0)
  })

  it('カウンターで全数に達したときにも出る', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-ripple-counter" />,
    )
    const row = () => rows(container)[0]!

    await click(counterButtons(row())[1]!)
    await click(counterButtons(row())[1]!)
    // まだ 2 / 3 なので出ない
    expect(ripples(container)).toHaveLength(0)

    await click(counterButtons(row())[1]!)
    expect(ripples(container)).toHaveLength(1)
  })

  it('連打しても重ならず、最新の1つを描き直す', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-ripple-rapid" />,
    )
    const row = () => rows(container)[0]!

    await click(checkbox(row()))
    const first = ripples(container)[0]
    await click(checkbox(row()))
    await click(checkbox(row()))

    const after = ripples(container)
    expect(after).toHaveLength(1)
    // 別の要素になっている＝前の波紋を残さず最初から描き直している
    expect(after[0]).not.toBe(first)
  })

  it('動きを減らす設定では波紋を描かない', async () => {
    installMemoryLocalStorage()
    stubReducedMotion()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-ripple-reduced" />,
    )

    await click(checkbox(rows(container)[0]!))
    expect(ripples(container)).toHaveLength(0)
    // 消し込み自体は普通に効く
    expect(rows(container)[0]!.textContent).toContain('建てた 3 / 3')
  })
})

// ---------------------------------------------------------------------------
// 画面をスリープさせない（Screen Wake Lock API）
// ---------------------------------------------------------------------------

const wakeToggle = (container: HTMLElement): HTMLInputElement | null =>
  container.querySelector<HTMLInputElement>('.build-wake input[type="checkbox"]')

describe('画面スリープ抑止', () => {
  it('対応していないブラウザではトグルを出さない', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-nowake" />,
    )

    expect(wakeToggle(container)).toBeNull()
    expect(container.textContent).not.toContain('画面をスリープさせない')
  })

  it('オンで取得し、オフで解放する', async () => {
    installMemoryLocalStorage()
    const wakeLock = installWakeLock()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-wake" />,
    )
    const toggle = wakeToggle(container)!

    expect(container.textContent).toContain('画面をスリープさせない')
    expect(toggle.checked).toBe(false)

    await click(toggle)
    expect(wakeLock.request).toHaveBeenCalledTimes(1)
    expect(wakeLock.request).toHaveBeenCalledWith('screen')
    expect(wakeToggle(container)!.checked).toBe(true)
    expect(wakeLock.sentinels[0]!.released).toBe(false)

    await click(wakeToggle(container)!)
    expect(wakeToggle(container)!.checked).toBe(false)
    expect(wakeLock.sentinels[0]!.released).toBe(true)
  })

  it('OSに外されても、表に戻ったら取り直す', async () => {
    installMemoryLocalStorage()
    const wakeLock = installWakeLock()
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-wake-visible" />,
    )
    await click(wakeToggle(container)!)
    expect(wakeLock.request).toHaveBeenCalledTimes(1)

    // タブを隠すと OS 側でロックが外れる
    await act(async () => {
      wakeLock.sentinels[0]!.emitRelease()
    })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(wakeLock.request).toHaveBeenCalledTimes(2)
    expect(wakeLock.sentinels).toHaveLength(2)
    expect(wakeToggle(container)!.checked).toBe(true)
  })

  it('タブを離れる（アンマウント）と解放する', async () => {
    installMemoryLocalStorage()
    const wakeLock = installWakeLock()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <BuildListView solution={solution} extraction={null} planHash="plan-wake-unmount" />,
      )
    })
    await click(wakeToggle(container)!)
    expect(wakeLock.sentinels[0]!.released).toBe(false)

    await act(async () => {
      root.unmount()
    })
    expect(wakeLock.sentinels[0]!.released).toBe(true)
  })

  it('要求が拒否されたらトグルはオフに戻る（落ちない）', async () => {
    installMemoryLocalStorage()
    const wakeLock = installWakeLock('reject')
    const container = await render(
      <BuildListView solution={solution} extraction={null} planHash="plan-wake-reject" />,
    )

    await click(wakeToggle(container)!)
    expect(wakeLock.request).toHaveBeenCalledTimes(1)
    expect(wakeToggle(container)!.checked).toBe(false)
    // 画面は生きていて消し込みも続けられる
    await click(checkbox(rows(container)[0]!))
    expect(overallText(container)).toContain('3 / 7')
  })
})
