// @vitest-environment jsdom
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultPlanInput } from '../src/plan/serialize.ts'
import { createMemoryPlanStorage, setPlanStorage } from '../src/plan/storage.ts'
import { usePlanner } from '../src/store/planner.ts'
import { NARROW_VIEWPORT_QUERY } from '../src/ui/responsive.ts'
import { Sidebar } from '../src/ui/Sidebar.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const RESPONSIVE_PANEL_TITLES = [
  '既にあるアイテム',
  '目的関数',
  '発電計画',
  'クロックとサマースループ',
  '採掘設備',
  '物流',
  'プラン',
  'Excel出力',
] as const

const PRESERVED_CLOSED_PANEL_TITLES = ['代替レシピ', '原料上限'] as const
const mounted: Root[] = []

class ControllableMediaQueryList extends EventTarget implements MediaQueryList {
  onchange: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null = null
  readonly media: string
  private currentMatches: boolean

  constructor(media: string, currentMatches: boolean) {
    super()
    this.media = media
    this.currentMatches = currentMatches
  }

  get matches(): boolean {
    return this.currentMatches
  }

  setMatches(matches: boolean): void {
    if (matches === this.currentMatches) return
    this.currentMatches = matches
    const event = Object.assign(new Event('change'), {
      matches,
      media: this.media,
    }) as MediaQueryListEvent
    this.dispatchEvent(event)
    this.onchange?.call(this, event)
  }

  addListener(
    listener: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null,
  ): void {
    if (listener !== null) this.addEventListener('change', listener as EventListener)
  }

  removeListener(
    listener: ((this: MediaQueryList, event: MediaQueryListEvent) => unknown) | null,
  ): void {
    if (listener !== null) this.removeEventListener('change', listener as EventListener)
  }
}

function installMatchMedia(initialNarrow: boolean): { setNarrow: (narrow: boolean) => void } {
  const queries = new Map<string, ControllableMediaQueryList>()
  const matchMedia = vi.fn((query: string): MediaQueryList => {
    const existing = queries.get(query)
    if (existing !== undefined) return existing

    const mediaQuery = new ControllableMediaQueryList(
      query,
      query === NARROW_VIEWPORT_QUERY && initialNarrow,
    )
    queries.set(query, mediaQuery)
    return mediaQuery
  })
  vi.stubGlobal('matchMedia', matchMedia)

  return {
    setNarrow: (narrow) => {
      const mediaQuery = queries.get(NARROW_VIEWPORT_QUERY)
      if (mediaQuery === undefined) {
        throw new Error(`media query was not observed: ${NARROW_VIEWPORT_QUERY}`)
      }
      mediaQuery.setMatches(narrow)
    },
  }
}

async function render(node: ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(node))
  mounted.push(root)
  return container
}

function panelTitle(container: HTMLElement, title: string): HTMLElement {
  const element = [...container.querySelectorAll<HTMLElement>('.panel__title')].find(
    (candidate) => candidate.textContent === title,
  )
  if (element === undefined) throw new Error(`panel was not found: ${title}`)
  return element
}

function panelToggle(container: HTMLElement, title: string): HTMLButtonElement {
  const toggle = panelTitle(container, title).closest<HTMLButtonElement>('button.panel__toggle')
  if (toggle === null) throw new Error(`panel toggle was not found: ${title}`)
  return toggle
}

function expectPanelExpanded(container: HTMLElement, title: string, expanded: boolean): void {
  const toggle = panelToggle(container, title)
  expect(toggle.getAttribute('aria-expanded'), title).toBe(String(expanded))

  const bodyId = toggle.getAttribute('aria-controls')
  if (bodyId !== null) {
    const body = document.getElementById(bodyId)
    if (expanded) expect(body, title).not.toBeNull()
    else expect(body, title).toBeNull()
  }
}

function expectTargetsVisibleAndNotCollapsible(container: HTMLElement): void {
  const title = panelTitle(container, '目標産出')
  const panel = title.closest<HTMLElement>('.panel')
  expect(panel).not.toBeNull()
  expect(panel?.querySelector('.panel__toggle')).toBeNull()
  expect(
    panel?.querySelector<HTMLInputElement>('input[placeholder="アイテム名（例: 鉄板）"]'),
  ).not.toBeNull()
}

beforeEach(() => {
  setPlanStorage(createMemoryPlanStorage())
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

afterEach(async () => {
  await act(async () => {
    for (const root of mounted.splice(0)) root.unmount()
  })
  document.body.innerHTML = ''
  history.replaceState(null, '', '/')
  setPlanStorage(null)
  vi.unstubAllGlobals()
})

describe('サイドバーのレスポンシブ折りたたみ', () => {
  it('デスクトップでは対象8パネルを開き、目標産出と既存パネルの挙動を保つ', async () => {
    installMatchMedia(false)
    const container = await render(<Sidebar />)

    for (const title of RESPONSIVE_PANEL_TITLES) {
      expectPanelExpanded(container, title, true)
    }
    expectTargetsVisibleAndNotCollapsible(container)
    for (const title of PRESERVED_CLOSED_PANEL_TITLES) {
      expectPanelExpanded(container, title, false)
    }
  })

  it('狭幅では対象8パネルを閉じ、目標産出と既存パネルの挙動を保つ', async () => {
    installMatchMedia(true)
    const container = await render(<Sidebar />)

    for (const title of RESPONSIVE_PANEL_TITLES) {
      expectPanelExpanded(container, title, false)
    }
    expectTargetsVisibleAndNotCollapsible(container)
    for (const title of PRESERVED_CLOSED_PANEL_TITLES) {
      expectPanelExpanded(container, title, false)
    }
  })

  it('狭幅でユーザーが開いたパネルはviewportが変化して戻っても開いたままにする', async () => {
    const viewport = installMatchMedia(true)
    const container = await render(<Sidebar />)
    const title = '目的関数'

    expectPanelExpanded(container, title, false)
    await act(async () => panelToggle(container, title).click())
    expectPanelExpanded(container, title, true)

    await act(async () => viewport.setNarrow(false))
    expectPanelExpanded(container, title, true)
    await act(async () => viewport.setNarrow(true))
    expectPanelExpanded(container, title, true)
  })
})
