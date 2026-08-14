/**
 * アイテム / 建物のアイコン（無ければ何も描かない）。
 *
 * 画像はゲームアセットで、権利者の要請があれば public/icons ごと消す前提の作り
 * （public/icons/SOURCES.md）。**アイコンが無くても画面が成立すること**が条件なので、
 * ここは常に「描けなければ null を返す」だけにして、名前などの文字は呼び出し側が持つ。
 */
import { useState } from 'react'
import type { ReactNode } from 'react'

import { useLocale } from '../i18n/index.ts'
import { itemPagePath } from '../plan/item-pages.ts'
import { itemName } from './format.ts'
import { HARD_DRIVE_ICON_ID, iconPath } from './icons.ts'
import { T } from './text.ts'

/** 表・一覧の1行に置くアイコンの大きさ(px)。行送り（13px文字）を押し広げない大きさ。 */
export const CELL_ICON = 16

type Props = {
  /** アイテムID（Desc_*）または建物ID（Build_*） */
  id: string
  /** 読み上げ用の名前（アイテム名）。省略時はIDを使う */
  name?: string
  /** 表示サイズ(px)。CSS 側も同じ値で場所を取る */
  size?: number
  className?: string
}

export function ItemIcon({ id, name, size = 20, className }: Props) {
  const src = iconPath(id)
  // 一覧には載っているのにファイルが消えている場合（撤去後など）は個別に消す
  const [broken, setBroken] = useState(false)
  if (src === null || broken) return null

  return (
    <img
      className={className === undefined ? 'item-icon' : `item-icon ${className}`}
      src={src}
      alt={name ?? id}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  )
}

/**
 * 代替レシピの目印（ハードドライブ）。レシピ名の**先頭**に置く補助記号で、
 * 名前の「代替: 」という文字は消さない（アイコンが撤去されても意味が伝わるように）。
 */
export function AlternateIcon({ size = CELL_ICON }: { size?: number }) {
  return <ItemIcon id={HARD_DRIVE_ICON_ID} name={T.sidebar.alternates} size={size} />
}

/**
 * アイテム名から静的アイテムページ（/items/{slug}/ または /en/items/{slug}/）へのリンク。
 *
 * ページを持たないID（建物など）はリンクにせず、渡された表示のまま返す。
 * 表の見た目を変えないよう、色は継承のままで下線はホバー・フォーカス時だけ出す（.item-link）。
 * リンク先は表示中の言語に合わせる（ja 以外は en ミラー。src/plan/item-pages.ts が正典）。
 */
export function ItemNameLink({ id, children }: { id: string; children: ReactNode }) {
  const { locale } = useLocale()
  const href = itemPagePath(id, locale)
  if (href === null) return <>{children}</>
  return (
    <a className="item-link" href={href}>
      {children}
    </a>
  )
}

/**
 * 「アイテムページを開く」と明示するリンク（レシピ詳細のヘッダー用）。
 * 表の中のアイテム名リンクと違い、ページ遷移すると分かる文言を出す。
 */
export function ItemPageLink({ id, className }: { id: string; className?: string }) {
  const { locale } = useLocale()
  const href = itemPagePath(id, locale)
  if (href === null) return null
  return (
    <a
      className={className === undefined ? 'item-page-link' : `item-page-link ${className}`}
      href={href}
      aria-label={T.itemPage.openFor(itemName(id))}
    >
      {T.itemPage.open}
    </a>
  )
}

type LabelProps = {
  /** アイテムID（Desc_*） */
  id: string
  /** 表示するアイテム名（アイコンの alt にも使う） */
  name: string
  /** アイコンの表示サイズ(px) */
  size?: number
  /** 名前のうしろに足すもの（単位など） */
  children?: ReactNode
}

/**
 * 「アイコン＋アイテム名」の1組（表のセル・一覧の行で使う）。
 *
 * 場所は gap で確保する側（.cell-name の flex）なので、アイコンが無い・撤去された
 * アイテムでも名前だけがそのまま残る。名前だけをアイテムページへのリンクにし、
 * アイコンと単位はリンクに含めない（誤タップと読み上げの冗長を避ける）。
 */
export function ItemLabel({ id, name, size = CELL_ICON, children }: LabelProps) {
  return (
    <span className="cell-name">
      <ItemIcon id={id} name={name} size={size} />
      <span>
        <ItemNameLink id={id}>{name}</ItemNameLink>
        {children}
      </span>
    </span>
  )
}
