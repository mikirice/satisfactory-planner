/**
 * アイテム / 建物のアイコン（無ければ何も描かない）。
 *
 * 画像はゲームアセットで、権利者の要請があれば public/icons ごと消す前提の作り
 * （public/icons/SOURCES.md）。**アイコンが無くても画面が成立すること**が条件なので、
 * ここは常に「描けなければ null を返す」だけにして、名前などの文字は呼び出し側が持つ。
 */
import { useState } from 'react'

import { iconPath } from './icons.ts'

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
