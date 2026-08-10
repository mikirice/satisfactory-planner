// @vitest-environment jsdom
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
    for (const entry of mounted.splice(0)) entry.unmount()
  })
  document.head.querySelector('#google-adsense-script')?.remove()
  document.body.innerHTML = ''
  vi.resetModules()
  vi.doUnmock('../src/config/ads.ts')
  vi.doUnmock('../src/ui/adsense.ts')
})

const sizes = {
  rect: { width: 300, height: 250 },
  banner: { width: 728, height: 90 },
} as const

describe('広告枠', () => {
  it('広告が無効なときは描画せずローダーも呼ばない', async () => {
    const loadAdSenseScript = vi.fn()
    vi.doMock('../src/config/ads.ts', () => ({
      ADS_ENABLED: false,
      ADSENSE_CLIENT: 'ca-pub-test',
      SLOT_SIDEBAR_RECT: 'sidebar-test',
      SLOT_RESULT_BANNER: 'banner-test',
      AD_SLOT_SIZES: sizes,
    }))
    vi.doMock('../src/ui/adsense.ts', () => ({ loadAdSenseScript }))
    const { AdSlot } = await import('../src/ui/AdSlot.tsx')

    const container = await render(<AdSlot slot="rect" />)

    expect(container.childElementCount).toBe(0)
    expect(loadAdSenseScript).not.toHaveBeenCalled()
  })

  it('スロットIDが空のときは描画せずローダーも呼ばない', async () => {
    const loadAdSenseScript = vi.fn()
    vi.doMock('../src/config/ads.ts', () => ({
      ADS_ENABLED: true,
      ADSENSE_CLIENT: 'ca-pub-test',
      SLOT_SIDEBAR_RECT: '',
      SLOT_RESULT_BANNER: '',
      AD_SLOT_SIZES: sizes,
    }))
    vi.doMock('../src/ui/adsense.ts', () => ({ loadAdSenseScript }))
    const { AdSlot } = await import('../src/ui/AdSlot.tsx')

    const container = await render(<AdSlot slot="rect" />)

    expect(container.childElementCount).toBe(0)
    expect(loadAdSenseScript).not.toHaveBeenCalled()
  })

  it('設定済みの広告枠を正しい属性と固定寸法で描画し、Vitestではスクリプトを読み込まない', async () => {
    vi.doMock('../src/config/ads.ts', () => ({
      ADS_ENABLED: true,
      ADSENSE_CLIENT: 'ca-pub-test',
      SLOT_SIDEBAR_RECT: 'sidebar-test',
      SLOT_RESULT_BANNER: 'banner-test',
      AD_SLOT_SIZES: sizes,
    }))
    const { AdSlot } = await import('../src/ui/AdSlot.tsx')

    const rectContainer = await render(<AdSlot slot="rect" />)
    const bannerContainer = await render(<AdSlot slot="banner" />)
    const rectAd = rectContainer.querySelector<HTMLElement>('ins.adsbygoogle')
    const bannerAd = bannerContainer.querySelector<HTMLElement>('ins.adsbygoogle')

    expect(rectContainer.textContent).toContain('広告')
    expect(rectAd?.dataset.adClient).toBe('ca-pub-test')
    expect(rectAd?.dataset.adSlot).toBe('sidebar-test')
    expect(rectAd?.dataset.fullWidthResponsive).toBe('false')
    expect(rectAd?.style.width).toBe('300px')
    expect(rectAd?.style.height).toBe('250px')
    expect(bannerAd?.dataset.adSlot).toBe('banner-test')
    expect(bannerAd?.style.width).toBe('728px')
    expect(bannerAd?.style.height).toBe('90px')
    expect(document.querySelector('#google-adsense-script')).toBeNull()
    expect((window as typeof window & { adsbygoogle?: unknown }).adsbygoogle).toBeUndefined()
  })
})
