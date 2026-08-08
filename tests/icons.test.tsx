// @vitest-environment jsdom
/**
 * アイコン（public/icons）の解決とフォールバックの検証。
 *
 * アイコンはゲームアセットなので **いつ消えても画面が壊れないこと** が前提
 * （public/icons/SOURCES.md の撤去手順）。ここで見るのは3点:
 *   1. ID → 画像パスの解決（未知IDは null）
 *   2. 同梱している ID が実データ（アイテム/建物）と一致していること
 *   3. アイコンが無い / 読み込みに失敗したときは img を出さず、文字だけが残ること
 *
 * ネットワークもファイルの実在も見ない（実画像の欠けはビルド時に vite が警告する）。
 */
import { act } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import iconIdsJson from '../src/data/icons.json'
import { buildings, items } from '../src/data/index.ts'

const iconIds = iconIdsJson as string[]
import { ItemIcon } from '../src/ui/ItemIcon.tsx'
import { hasIcon, iconCount, iconPath } from '../src/ui/icons.ts'

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
    for (const m of mounted.splice(0)) m.unmount()
  })
  document.body.innerHTML = ''
})

describe('アイコンのパス解決', () => {
  it('同梱しているIDは public/icons のパスを返す', () => {
    expect(iconPath('Desc_IronPlate_C')).toBe('/icons/Desc_IronPlate_C.png')
    expect(iconPath('Build_ConstructorMk1_C')).toBe('/icons/Build_ConstructorMk1_C.png')
  })

  it('知らないIDは null（呼び出し側は文字だけ描く）', () => {
    expect(iconPath('Desc_NotAnItem_C')).toBeNull()
    expect(iconPath('')).toBeNull()
    expect(hasIcon('Desc_NotAnItem_C')).toBe(false)
  })

  it('同梱しているIDはすべて実データのアイテム/建物である（余計なファイルを持たない）', () => {
    const known = new Set([...items.map((i) => i.id), ...buildings.map((b) => b.id)])
    const orphans = iconIds.filter((id) => !known.has(id))
    expect(orphans).toEqual([])
  })

  it('icons.json と hasIcon が一致する（一覧が唯一の判定基準）', () => {
    expect(iconIds.every((id) => hasIcon(id))).toBe(true)
    expect(iconCount()).toBe(new Set(iconIds).size)
  })

  it('アイコンを同梱しているならほぼ全アイテム・全建物ぶんそろっている', () => {
    // 撤去（public/icons を消して icons.json を空にする）した場合はこの検証を飛ばす。
    // 「消しても壊れない」ことが優先で、そのときテストが赤くなってはいけない。
    if (iconCount() === 0) return
    const all = [...items.map((i) => i.id), ...buildings.map((b) => b.id)]
    const missing = all.filter((id) => !hasIcon(id))
    // 入手元（公式Wiki）にアイコン画像が無いものが数件ある（public/icons/SOURCES.md に一覧）。
    // それらは文字だけの表示に落ちるので、全件そろうことまでは求めない。
    expect(missing.length / all.length, `未収録: ${missing.join(', ')}`).toBeLessThan(0.05)
  })
})

describe('ItemIcon の描画とフォールバック', () => {
  it('アイコンがあるときは img を描く（lazy・alt はアイテム名）', async () => {
    const container = await render(<ItemIcon id="Desc_IronPlate_C" name="鉄板" size={24} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toBe('/icons/Desc_IronPlate_C.png')
    expect(img!.getAttribute('alt')).toBe('鉄板')
    expect(img!.getAttribute('loading')).toBe('lazy')
    expect(img!.getAttribute('width')).toBe('24')
    expect(img!.getAttribute('height')).toBe('24')
  })

  it('アイコンが無いIDでは何も描かない（文字だけの表示に戻る）', async () => {
    const container = await render(
      <span className="target__name">
        <ItemIcon id="Desc_NotAnItem_C" name="架空アイテム" />
        架空アイテム
      </span>,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('架空アイテム')
  })

  it('画像の読み込みに失敗したら img を消す（画像だけ消された場合）', async () => {
    const container = await render(
      <span>
        <ItemIcon id="Desc_IronPlate_C" name="鉄板" />
        鉄板
      </span>,
    )
    const img = container.querySelector('img')!
    await act(async () => {
      img.dispatchEvent(new Event('error', { bubbles: false }))
    })
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('鉄板')
  })
})
