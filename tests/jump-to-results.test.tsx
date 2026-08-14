// @vitest-environment jsdom
import { act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { JumpToResults } from '../src/ui/JumpToResults.tsx'
import {
  NARROW_VIEWPORT_QUERY,
  REDUCED_MOTION_QUERY,
} from '../src/ui/responsive.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mounted: { unmount: () => void }[] = []

type ObserverMock = {
  emit: (target: Element, intersecting: boolean, top: number) => void
  disconnect: ReturnType<typeof vi.fn>
}

function mockMatchMedia({ narrow = true, reducedMotion = false } = {}): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(
      (query: string): MediaQueryList =>
        ({
          matches:
            query === NARROW_VIEWPORT_QUERY
              ? narrow
              : query === REDUCED_MOTION_QUERY && reducedMotion,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) as unknown as MediaQueryList,
    ),
  )
}

function mockIntersectionObserver(): ObserverMock {
  let callback: IntersectionObserverCallback | undefined
  const disconnect = vi.fn()

  class MockIntersectionObserver {
    constructor(next: IntersectionObserverCallback) {
      callback = next
    }

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {
      disconnect()
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

  return {
    emit: (target, isIntersecting, top) => {
      const entry = {
        target,
        isIntersecting,
        boundingClientRect: { top },
        rootBounds: { bottom: 800 },
      } as unknown as IntersectionObserverEntry
      callback?.([entry], {} as IntersectionObserver)
    },
    disconnect,
  }
}

async function renderJump(available = true): Promise<HTMLElement> {
  function Harness() {
    const targetRef = useRef<HTMLElement>(null)
    return (
      <>
        <main ref={targetRef}>結果</main>
        <JumpToResults
          targetRef={targetRef}
          available={available}
          statusLabel="最適解"
          statusClassName="is-surplus"
        />
      </>
    )
  }

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<Harness />))
  mounted.push({ unmount: () => root.unmount() })
  return container
}

afterEach(async () => {
  await act(async () => {
    for (const entry of mounted.splice(0)) entry.unmount()
  })
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('結果へのジャンプ', () => {
  it('狭幅で結果が下にある間だけボタンを表示する', async () => {
    mockMatchMedia()
    const observer = mockIntersectionObserver()
    const container = await renderJump()
    const target = container.querySelector('main')!

    expect(container.querySelector('.jump-to-results')).toBeNull()

    await act(async () => observer.emit(target, false, 900))
    const button = container.querySelector<HTMLButtonElement>('.jump-to-results')!
    expect(button.textContent).toContain('結果を見る')
    expect(button.textContent).toContain('最適解')

    await act(async () => observer.emit(target, true, 100))
    expect(container.querySelector('.jump-to-results')).toBeNull()

    // 結果を通り過ぎて上へ外れた場合も、ボタンを再表示しない。
    await act(async () => observer.emit(target, false, -900))
    expect(container.querySelector('.jump-to-results')).toBeNull()
  })

  it('desktop では結果が下にあっても表示しない', async () => {
    mockMatchMedia({ narrow: false })
    const observer = mockIntersectionObserver()
    const container = await renderJump()
    const target = container.querySelector('main')!

    await act(async () => observer.emit(target, false, 900))
    expect(container.querySelector('.jump-to-results')).toBeNull()
  })

  it.each([
    { reducedMotion: false, behavior: 'smooth' as const },
    { reducedMotion: true, behavior: 'instant' as const },
  ])('動きを減らす設定に応じて $behavior でスクロールする', async ({ reducedMotion, behavior }) => {
    mockMatchMedia({ reducedMotion })
    const observer = mockIntersectionObserver()
    const container = await renderJump()
    const target = container.querySelector<HTMLElement>('main')!
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView

    await act(async () => observer.emit(target, false, 900))
    await act(async () => container.querySelector<HTMLButtonElement>('.jump-to-results')!.click())

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior, block: 'start' })
  })

  it('監視をアンマウント時に解除する', async () => {
    mockMatchMedia()
    const observer = mockIntersectionObserver()
    await renderJump()

    await act(async () => mounted.pop()!.unmount())
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })
})
