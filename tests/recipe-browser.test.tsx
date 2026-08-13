// @vitest-environment jsdom
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App.tsx'
import { items } from '../src/data/index.ts'
import { defaultPlanInput, toPlanSnapshot } from '../src/plan/serialize.ts'
import { createMemoryPlanStorage, setPlanStorage } from '../src/plan/storage.ts'
import { usePlanner } from '../src/store/planner.ts'
import { RecipeBrowser } from '../src/ui/RecipeBrowser.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mounted: { unmount: () => void }[] = []

async function render(node: ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(node))
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
  vi.unstubAllGlobals()
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

describe('レシピブラウザ', () => {
  it('全アイテムと空状態のおすすめを描画する', async () => {
    const container = await render(<RecipeBrowser onCreatePlan={() => undefined} />)

    expect(container.querySelectorAll('[data-recipe-browser-item]')).toHaveLength(items.length)
    expect(container.textContent).toContain('左の検索または一覧からアイテムを選んでください。')
    expect(container.textContent).toContain('鉄板')
    expect(container.textContent).toContain('プラスチック')
    expect(container.textContent).toContain('ヘビー・モジュラー・フレーム')
  })

  it('選んだアイテムの作り方・使い道を描き、使い道から産物へ移動して戻れる', async () => {
    const container = await render(<RecipeBrowser onCreatePlan={() => undefined} />)
    const ironPlate = container.querySelector<HTMLButtonElement>(
      '[data-recipe-browser-item="Desc_IronPlate_C"]',
    )!

    await click(ironPlate)

    expect(container.querySelector('.recipe-browser__detail')?.getAttribute('data-selected-item-id')).toBe(
      'Desc_IronPlate_C',
    )
    expect(container.textContent).toContain('作り方')
    expect(container.textContent).toContain('使い道')
    expect(container.querySelectorAll('[data-recipe-id]')).toHaveLength(3)
    expect(container.querySelector('[data-recipe-id="Recipe_IronPlate_C"]')?.textContent).toContain(
      '鉄板',
    )
    expect(
      container.querySelector('[data-recipe-id="Recipe_Alternate_CoatedIronPlate_C"]')?.textContent,
    ).toContain('代替')

    await click(
      container.querySelector<HTMLButtonElement>(
        '[data-consuming-recipe-id="Recipe_Alternate_AdheredIronPlate_C"]',
      )!,
    )

    expect(container.querySelector('.recipe-browser__detail')?.getAttribute('data-selected-item-id')).toBe(
      'Desc_IronPlateReinforced_C',
    )
    expect(container.querySelector('.recipe-browser__item-header h2')?.textContent).toBe('強化鉄板')

    await click(container.querySelector<HTMLButtonElement>('.recipe-browser__back')!)
    expect(container.querySelector('.recipe-browser__detail')?.getAttribute('data-selected-item-id')).toBe(
      'Desc_IronPlate_C',
    )
  })

  it('計画作成コールバックへ対象・基準レート・代替レシピを渡す', async () => {
    const onCreatePlan = vi.fn()
    const container = await render(<RecipeBrowser onCreatePlan={onCreatePlan} />)

    await click(
      container.querySelector<HTMLButtonElement>(
        '[data-recipe-browser-item="Desc_IronPlate_C"]',
      )!,
    )
    const alternateCard = container.querySelector<HTMLElement>(
      '[data-recipe-id="Recipe_Alternate_CoatedIronPlate_C"]',
    )!
    await click(alternateCard.querySelector<HTMLButtonElement>('.recipe-browser__create-plan')!)

    expect(onCreatePlan).toHaveBeenCalledOnce()
    expect(onCreatePlan).toHaveBeenCalledWith({
      itemId: 'Desc_IronPlate_C',
      recipeId: 'Recipe_Alternate_CoatedIronPlate_C',
      ratePerMin: 75,
      alternateRecipeId: 'Recipe_Alternate_CoatedIronPlate_C',
    })
  })
})

describe('レシピモードの計画連携', () => {
  it('ヘッダーからレシピモードへ切り替えてもプラン入力を変更しない', async () => {
    usePlanner.setState({
      targets: [{ key: 'existing', item: 'Desc_IronRod_C', ratePerMin: 30 }],
    })
    const before = usePlanner.getState().targets
    const container = await render(<App />)

    const modeButtons = [...container.querySelectorAll<HTMLButtonElement>('.header__mode-button')]
    expect(modeButtons.map((button) => button.textContent)).toEqual([
      '通常レシピ',
      'ループ',
      'レシピ',
    ])

    await click(modeButtons.find((button) => button.textContent === 'レシピ')!)

    expect(container.querySelector('.recipe-browser')).not.toBeNull()
    expect(container.querySelector('.layout')?.hasAttribute('hidden')).toBe(true)
    expect(usePlanner.getState().targets).toEqual(before)
  })

  it('未保存の入力があってもレシピモードの往復で古い自動保存へ戻さない', async () => {
    const storage = createMemoryPlanStorage()
    setPlanStorage(storage)
    const container = await render(<App />)
    // PlansPanel の初回復元と自動保存購読の開始を待つ。
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))

    await storage.putAutosave(
      toPlanSnapshot({
        ...defaultPlanInput(),
        targets: [{ key: 'stale', item: 'Desc_IronPlate_C', ratePerMin: 20 }],
      }),
    )
    await act(async () => {
      usePlanner.setState({
        targets: [{ key: 'current', item: 'Desc_IronRod_C', ratePerMin: 30 }],
      })
    })

    const modeButton = (label: string): HTMLButtonElement =>
      [...container.querySelectorAll<HTMLButtonElement>('.header__mode-button')].find(
        (button) => button.textContent === label,
      )!
    await click(modeButton('レシピ'))
    await click(modeButton('通常レシピ'))
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))

    expect(usePlanner.getState().targets.map(({ item, ratePerMin }) => [item, ratePerMin])).toEqual([
      ['Desc_IronRod_C', 30],
    ])
  })

  it('既存作業の確認後、選んだ代替の基準レートだけを計画へ反映する', async () => {
    const storage = createMemoryPlanStorage()
    setPlanStorage(storage)
    usePlanner.setState({
      targets: [{ key: 'existing', item: 'Desc_IronRod_C', ratePerMin: 30 }],
      enabledAlternates: { Recipe_Alternate_IronWire_C: true },
    })
    const confirmMock = vi.fn(() => true)
    vi.stubGlobal('confirm', confirmMock)
    const container = await render(<App />)

    await click(
      [...container.querySelectorAll<HTMLButtonElement>('.header__mode-button')].find(
        (button) => button.textContent === 'レシピ',
      )!,
    )
    await click(
      container.querySelector<HTMLButtonElement>(
        '[data-recipe-browser-item="Desc_IronPlate_C"]',
      )!,
    )

    const alternateCard = container.querySelector<HTMLElement>(
      '[data-recipe-id="Recipe_Alternate_CoatedIronPlate_C"]',
    )!
    await act(async () => {
      alternateCard.querySelector<HTMLButtonElement>('.recipe-browser__create-plan')!.click()
      // 計画の即時自動保存と、通常モードへの切り替えを待つ。
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(confirmMock).toHaveBeenCalledWith(
      '現在の入力を「鉄板の計画」で置き換えます。よろしいですか？',
    )
    expect(usePlanner.getState().targets.map(({ item, ratePerMin }) => [item, ratePerMin])).toEqual([
      ['Desc_IronPlate_C', 75],
    ])
    expect(usePlanner.getState().enabledAlternates).toEqual({
      Recipe_Alternate_CoatedIronPlate_C: true,
    })
    expect(
      [...container.querySelectorAll<HTMLButtonElement>('.header__mode-button')].find(
        (button) => button.textContent === '通常レシピ',
      )?.getAttribute('aria-pressed'),
    ).toBe('true')
    expect((await storage.getAutosave())?.t).toEqual([['Desc_IronPlate_C', 75]])
    expect((await storage.getAutosave())?.a).toEqual([
      'Recipe_Alternate_CoatedIronPlate_C',
    ])
  })

  it('既存作業の置き換えを取り消した場合はレシピ画面と入力を保つ', async () => {
    usePlanner.setState({
      targets: [{ key: 'existing', item: 'Desc_IronRod_C', ratePerMin: 30 }],
    })
    vi.stubGlobal('confirm', vi.fn(() => false))
    const container = await render(<App />)

    await click(
      [...container.querySelectorAll<HTMLButtonElement>('.header__mode-button')].find(
        (button) => button.textContent === 'レシピ',
      )!,
    )
    await click(
      container.querySelector<HTMLButtonElement>(
        '[data-recipe-browser-item="Desc_IronPlate_C"]',
      )!,
    )
    await click(
      container.querySelector<HTMLElement>('[data-recipe-id="Recipe_IronPlate_C"]')!
        .querySelector<HTMLButtonElement>('.recipe-browser__create-plan')!,
    )

    expect(usePlanner.getState().targets.map(({ item, ratePerMin }) => [item, ratePerMin])).toEqual([
      ['Desc_IronRod_C', 30],
    ])
    expect(container.querySelector('.recipe-browser')).not.toBeNull()
  })
})
