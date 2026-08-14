// @vitest-environment jsdom
/**
 * ロケール基盤のテスト（計画書 §6 の品質保証項目 3「言語横断スモーク」と
 * 4「共有URL言語非依存」に対応）。
 *
 * ここで守りたいのは次の3点。
 * 1. 言語の自動判定と保存の規則（計画書 §4.3）
 * 2. 切り替えたとき、`useLocale` を直接使っていない画面まで表示が追随すること
 *    （UI文言は `T` 経由で現在のロケールを読むため、ここが崩れると一部だけ旧言語で残る）
 * 3. 共有URLで開いたプランが言語をまたいでも同じ内容で復元されること
 *
 * ソルバー本体（glpk.js の Web Worker）は jsdom で起動できないので、
 * 表示の検証は tests/ui.test.tsx と同じく解のフィクスチャで行う。
 * 求解結果が言語に依存しないことは tests/share-locale.test.ts（Node環境）が担当する。
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App.tsx'
import { buildingsById } from '../src/data/index.ts'
import {
  LOCALE_STORAGE_KEY,
  LocaleProvider,
  REGION_COLLAPSE_MAP,
  SUPPORTED_LOCALES,
  detectLocale,
  getDictionary,
  matchSupportedLocale,
} from '../src/i18n/index.ts'
import type { Locale } from '../src/i18n/index.ts'
import { encodePlan, toPlanSnapshot } from '../src/plan/serialize.ts'
import { createMemoryPlanStorage, setPlanStorage } from '../src/plan/storage.ts'
import { clockedPowerMW } from '../src/solver/index.ts'
import type { Solution } from '../src/solver/index.ts'
import { usePlanner } from '../src/store/planner.ts'
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
 * 言語の保存先を差し替える。
 *
 * Node 25 は `localStorage` という**空オブジェクト**をグローバルに置いており、jsdom の window は
 * それを引き継ぐため getItem すら生えていない（実装側は try/catch で握り潰すので画面は壊れない）。
 * 保存されることを実際に確かめたいテストだけ、この最小実装を挿す。
 */
function installMemoryLocalStorage(): void {
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
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')

function restoreLocalStorage(): void {
  if (originalLocalStorage === undefined) {
    Reflect.deleteProperty(window, 'localStorage')
    return
  }
  Object.defineProperty(window, 'localStorage', originalLocalStorage)
}

/** 言語スイッチャー（select）を操作する。React の値トラッカーを通すため setter を使う。 */
async function selectLocale(container: HTMLElement, locale: Locale): Promise<void> {
  const select = container.querySelector<HTMLSelectElement>('.header__language')!
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  setter?.call(select, locale)
  await act(async () => {
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

afterEach(async () => {
  await act(async () => {
    for (const m of mounted.splice(0)) m.unmount()
  })
  document.body.innerHTML = ''
  document.documentElement.lang = ''
  document.querySelector('meta[property="og:locale"]')?.remove()
  restoreLocalStorage()
  setPlanStorage(null)
  history.replaceState(null, '', '/')
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

// ---------------------------------------------------------------------------
// 表示専用の解フィクスチャ（鉄板 60/min 相当）。数値の正しさは solver.test.ts が見る。
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
  externalInputs: [],
  byproducts: [],
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

describe('言語の判定と保持', () => {
  it('保存済みの選択がブラウザの希望言語より優先される', () => {
    expect(detectLocale(['en-US', 'en'], 'ja')).toBe('ja')
    expect(detectLocale(['ja-JP'], 'en')).toBe('en')
  })

  it('保存が無ければ navigator.languages の先頭から対応言語を選ぶ', () => {
    expect(detectLocale(['ja-JP', 'en-US'], null)).toBe('ja')
    expect(detectLocale(['en-US', 'ja'], null)).toBe('en')
    expect(detectLocale(['en-GB'], null)).toBe('en')
    // 対応外が先頭でも、後続に対応言語があればそれを使う
    expect(detectLocale(['de-DE', 'en-US'], null)).toBe('en')
  })

  it('対応言語が無いときは既定の日本語のまま（既存ユーザーへの影響ゼロが優先）', () => {
    // 計画書 §8「既定は従来どおり日本語」に合わせた挙動。
    // Stage 2 で対応言語が増えたら de-DE などはそちらに吸われる。
    expect(detectLocale(['de-DE'], null)).toBe('ja')
    expect(detectLocale([], null)).toBe('ja')
  })

  it('壊れた保存値は無視してブラウザの希望言語に戻す', () => {
    expect(detectLocale(['en-US'], 'klingon')).toBe('en')
    expect(detectLocale(['en-US'], null)).toBe('en')
    expect(detectLocale(['en-US'], 42)).toBe('en')
  })

  it('地域タグを縮退させてから対応言語に照合する', () => {
    expect(matchSupportedLocale('ja-JP')).toBe('ja')
    expect(matchSupportedLocale('en_US')).toBe('en')
    expect(matchSupportedLocale('EN-GB')).toBe('en')
    // Stage 1 では ja/en だけなので、縮退先が未対応なら null（誤って ja/en に落とさない）
    expect(matchSupportedLocale('zh-TW')).toBeNull()
    expect(matchSupportedLocale('de-DE')).toBeNull()
  })

  it('簡体・繁体の取り違えが起きないよう縮退マップを固定する（Stage 2 の前提）', () => {
    expect(REGION_COLLAPSE_MAP['zh-cn']).toBe('zh-Hans')
    expect(REGION_COLLAPSE_MAP['zh-sg']).toBe('zh-Hans')
    expect(REGION_COLLAPSE_MAP['zh-tw']).toBe('zh-Hant')
    expect(REGION_COLLAPSE_MAP['zh-hk']).toBe('zh-Hant')
    expect(REGION_COLLAPSE_MAP['zh-mo']).toBe('zh-Hant')
    expect(REGION_COLLAPSE_MAP['pt-br']).toBe('pt-BR')
    expect(REGION_COLLAPSE_MAP.es).toBe('es-ES')
  })
})

describe('言語スイッチャー', () => {
  it('切り替えると、言語を直接読んでいない画面（サイドバー）まで英語になる', async () => {
    const container = await render(
      <LocaleProvider initialLocale="ja">
        <App />
      </LocaleProvider>,
    )

    expect(container.textContent).toContain(getDictionary('ja').sidebar.targets)
    expect(container.textContent).toContain(getDictionary('ja').viewMode.normal)

    await selectLocale(container, 'en')

    const text = container.textContent ?? ''
    // サイドバー（TargetsPanel）は useLocale を使わず T だけを読む画面
    expect(text).toContain(getDictionary('en').sidebar.targets)
    expect(text).toContain(getDictionary('en').sidebar.targetEmpty)
    expect(text).toContain(getDictionary('en').viewMode.normal)
    expect(text).not.toContain(getDictionary('ja').sidebar.targetEmpty)
    expect(text).not.toContain(getDictionary('ja').viewMode.loop)
  })

  it('選択を localStorage に保存し、<html lang> と og:locale を更新する', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <LocaleProvider initialLocale="ja">
        <App />
      </LocaleProvider>,
    )

    expect(document.documentElement.lang).toBe('ja')
    expect(document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')?.content).toBe(
      'ja_JP',
    )

    await selectLocale(container, 'en')

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')?.content).toBe(
      'en_US',
    )
  })

  it('日本語に戻せる', async () => {
    installMemoryLocalStorage()
    const container = await render(
      <LocaleProvider initialLocale="ja">
        <App />
      </LocaleProvider>,
    )

    await selectLocale(container, 'en')
    await selectLocale(container, 'ja')

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ja')
    expect(document.documentElement.lang).toBe('ja')
    expect(container.textContent).toContain(getDictionary('ja').sidebar.targets)
    expect(container.textContent).not.toContain(getDictionary('en').sidebar.targetEmpty)
  })
})

describe('言語ごとの表示スモーク（鉄板 60/min のサマリー）', () => {
  it.each(SUPPORTED_LOCALES)('%s: サマリーがその言語のラベルと公式アイテム名で出る', async (locale) => {
    const dictionary = getDictionary(locale)
    const container = await render(
      <LocaleProvider initialLocale={locale}>
        <SummaryPanel solution={ironPlate60} extraction={null} />
      </LocaleProvider>,
    )

    const text = container.textContent ?? ''
    expect(text).toContain(dictionary.summary.targets)
    expect(text).toContain(dictionary.summary.power)
    // ゲーム用語は公式名から解決される（手書きしない）
    expect(text).toContain(locale === 'ja' ? '鉄板' : 'Iron Plate')
    // 数値は Intl 経由でも桁が崩れない
    expect(text).toMatch(/60/)
  })
})

describe('英語表示に日本語が残っていない', () => {
  /**
   * ソースの走査（tests/hardcoded-japanese.test.ts）は「辞書の外に日本語リテラルが無いこと」までしか
   * 見られない。en 辞書の訳し忘れは実際に描画した文字を見るしかないので、ここで押さえる。
   */
  const JAPANESE = /[々〆〇〻぀-ヿ㐀-鿿ｦ-ﾟ]/

  /** 言語スイッチャーの「日本語」だけは英語表示でも日本語のまま出るのが正しい。 */
  function textWithoutLanguageSwitcher(container: HTMLElement): string {
    const clone = container.cloneNode(true) as HTMLElement
    clone.querySelector('.header__language')?.remove()
    return clone.textContent ?? ''
  }

  it('初期画面（サイドバー・ヘッダー・空状態）が全て英語', async () => {
    const container = await render(
      <LocaleProvider initialLocale="en">
        <App />
      </LocaleProvider>,
    )

    expect(textWithoutLanguageSwitcher(container)).not.toMatch(JAPANESE)
  })

  it('結果画面（サマリー・生産ステップ・原料・建設コスト）が全て英語', async () => {
    usePlanner.setState({ status: 'done', result: ironPlate60, extraction: null })

    const container = await render(
      <LocaleProvider initialLocale="en">
        <App />
      </LocaleProvider>,
    )

    expect(container.textContent).toContain('Iron Plate')
    expect(textWithoutLanguageSwitcher(container)).not.toMatch(JAPANESE)
  })

  it('結果のサマリーが全て英語（公式アイテム名を含む）', async () => {
    const container = await render(
      <LocaleProvider initialLocale="en">
        <SummaryPanel solution={ironPlate60} extraction={null} />
      </LocaleProvider>,
    )

    expect(textWithoutLanguageSwitcher(container)).not.toMatch(JAPANESE)
  })
})

describe('共有URLは言語をまたいでも同じプランを開く', () => {
  /** ja 環境で作った共有URLのペイロード（保存形式はIDのみで言語非依存）。 */
  const encodedFromJa = (): string =>
    encodePlan(
      toPlanSnapshot({
        targets: [{ key: 't1', item: 'Desc_IronPlate_C', ratePerMin: 60 }],
        enabledAlternates: {},
        limitOverrides: {},
        objective: 'buildings',
        minerId: usePlanner.getState().minerId,
        planName: '鉄板ライン',
        beltId: usePlanner.getState().beltId,
        pipeId: usePlanner.getState().pipeId,
      }),
    )

  it('ja で作った共有URLを en で開くと、同じ入力が復元されて表示だけ英語になる', async () => {
    setPlanStorage(createMemoryPlanStorage())
    history.replaceState(null, '', `/#plan=${encodedFromJa()}`)

    const container = await render(
      <LocaleProvider initialLocale="en">
        <App />
      </LocaleProvider>,
    )

    const state = usePlanner.getState()
    expect(state.targets.map((t) => [t.item, t.ratePerMin])).toEqual([['Desc_IronPlate_C', 60]])
    expect(state.objective).toBe('buildings')
    // プラン名は利用者が入力した文字列なので翻訳しない
    expect(state.planName).toBe('鉄板ライン')

    const text = container.textContent ?? ''
    expect(text).toContain(getDictionary('en').sidebar.targets)
    expect(text).toContain('Iron Plate')
  })

  it('共有URLのペイロードは表示言語を変えても同一（保存形式はIDのみ）', async () => {
    const encoded = encodedFromJa()
    setPlanStorage(createMemoryPlanStorage())
    history.replaceState(null, '', `/#plan=${encoded}`)

    await render(
      <LocaleProvider initialLocale="en">
        <App />
      </LocaleProvider>,
    )

    const state = usePlanner.getState()
    const reEncoded = encodePlan(
      toPlanSnapshot({
        targets: state.targets,
        enabledAlternates: state.enabledAlternates,
        limitOverrides: state.limitOverrides,
        objective: state.objective,
        minerId: state.minerId,
        planName: state.planName,
        beltId: state.beltId,
        pipeId: state.pipeId,
      }),
    )

    expect(reEncoded).toBe(encoded)
  })
})
