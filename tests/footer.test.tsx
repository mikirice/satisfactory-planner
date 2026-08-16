// @vitest-environment jsdom
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocaleProvider } from '../src/i18n/index.ts'
import { AdSlot } from '../src/ui/AdSlot.tsx'
import { SiteFooter } from '../src/ui/SiteFooter.tsx'

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
  document.body.innerHTML = ''
  vi.doUnmock('../src/config/ads.ts')
})

describe('サイトフッター', () => {
  it('免責文と別タブで開くプライバシーポリシーへのリンクを表示する', async () => {
    const container = await render(<SiteFooter />)
    const link = container.querySelector<HTMLAnchorElement>('a[href="/privacy.html"]')

    expect(container.textContent).toContain(
      '非公式のファンツールです。Coffee Stain Studios とは無関係です。',
    )
    expect(link?.textContent).toBe('プライバシーポリシー')
    expect(link?.getAttribute('href')).toBe('/privacy.html')
    expect(link?.target).toBe('_blank')
  })

  it('静的な解説記事とアイテム一覧への内部リンクを表示する', async () => {
    const container = await render(<SiteFooter />)

    expect(container.querySelector<HTMLAnchorElement>('a[href="/articles/"]')?.textContent).toBe(
      '解説記事',
    )
    expect(container.querySelector<HTMLAnchorElement>('a[href="/items/"]')?.textContent).toBe(
      'アイテム一覧',
    )
  })

  it('サイト説明ページへの内部リンクを表示する', async () => {
    const container = await render(<SiteFooter />)

    expect(container.querySelector<HTMLAnchorElement>('a[href="/about/"]')?.textContent).toBe(
      'このサイトについて',
    )
  })

  /** Stage 3: 静的ページは日英ミラー。ja 以外の表示言語では /en/ 側へ送る。 */
  it('英語表示では英語ミラーへリンクする', async () => {
    const container = await render(
      <LocaleProvider initialLocale="en">
        <SiteFooter />
      </LocaleProvider>,
    )

    expect(
      container.querySelector<HTMLAnchorElement>('a[href="/en/articles/"]')?.textContent,
    ).toBe('Guides')
    expect(container.querySelector<HTMLAnchorElement>('a[href="/en/items/"]')?.textContent).toBe(
      'Items',
    )
    expect(container.querySelector<HTMLAnchorElement>('a[href="/en/about/"]')?.textContent).toBe(
      'About',
    )
    expect(container.querySelector('a[href="/articles/"]')).toBeNull()
    expect(container.querySelector('a[href="/about/"]')).toBeNull()
  })
})

describe('広告枠', () => {
  it('広告が無効なときはマークアップを一切描画しない', async () => {
    const container = await render(<AdSlot slot="rect" />)

    expect(container.childElementCount).toBe(0)
  })

  it('広告が有効なときはスロットごとの固定寸法を設定する', async () => {
    vi.resetModules()
    vi.doMock('../src/config/ads.ts', () => ({
      ADS_ENABLED: true,
      ADSENSE_CLIENT: 'ca-pub-test',
      SLOT_SIDEBAR_RECT: 'sidebar-test',
      SLOT_RESULT_BANNER: 'banner-test',
      AD_SLOT_SIZES: {
        rect: { width: 300, height: 250 },
        banner: { width: 728, height: 90 },
      },
    }))
    const { AdSlot: EnabledAdSlot } = await import('../src/ui/AdSlot.tsx')

    const rectContainer = await render(<EnabledAdSlot slot="rect" />)
    const bannerContainer = await render(<EnabledAdSlot slot="banner" />)
    const rect = rectContainer.querySelector<HTMLElement>('ins.adsbygoogle')
    const banner = bannerContainer.querySelector<HTMLElement>('ins.adsbygoogle')

    expect(rect?.style.width).toBe('300px')
    expect(rect?.style.height).toBe('250px')
    expect(banner?.style.width).toBe('728px')
    expect(banner?.style.height).toBe('90px')
  })
})
