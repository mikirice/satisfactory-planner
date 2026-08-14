/**
 * アイテム検索のドロップダウン（目標産出・既保有アイテムで共用）。
 *
 * 候補は **検索欄に紐づいたドロップダウン**（重ねて出す）。以前は候補を通常の
 * 流れの中に置いていたため、追加した後も候補が一覧のすぐ上に残り、
 * 「候補」と「追加済みの行」の区別が付かなかった（例: 強化鉄板を追加したのに
 * 「鉄板」も目標に入っていると誤解する）。選んだら閉じる・Escape / 外側クリックでも
 * 閉じる、の2点で切り分ける。
 */
import { useEffect, useMemo, useRef, useState } from 'react'

import { items } from '../data/index.ts'
import { useLocale } from '../i18n/index.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { T } from './text.ts'

/** 候補・一覧のアイコンサイズ(px)。文字（13〜14px）に対して主張しすぎない大きさ */
export const ROW_ICON = 20

/** 候補の表示上限。多すぎると選びにくいので絞る */
const MAX_SUGGESTIONS = 12

function matches(query: string, haystack: string[]): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return false
  return haystack.some((h) => h.toLowerCase().includes(q))
}

type Props = {
  label: string
  placeholder: string
  /** 既に追加済みのアイテムID（候補に「追加済み」と出す） */
  addedItems: ReadonlySet<string>
  /** 候補を選んだとき。追加済みなら行は増えない前提で呼び出し側が処理する */
  onPick: (itemId: string) => void
}

export function ItemSearchBox({ label, placeholder, addedItems, onPick }: Props) {
  const { locale, displayName } = useLocale()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    if (query.trim() === '') return []
    return [...items]
      .sort((a, b) => displayName(a).localeCompare(displayName(b), locale))
      .filter((i) => matches(query, [i.name.ja, i.name.en, i.id]))
      .slice(0, MAX_SUGGESTIONS)
  }, [query, locale, displayName])

  const showSuggestions = open && query.trim() !== ''

  // 外側をクリックしたら閉じる（候補が出しっぱなしにならないように）
  useEffect(() => {
    if (!showSuggestions) return
    const onPointerDown = (event: PointerEvent) => {
      const box = searchRef.current
      if (box && event.target instanceof Node && !box.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showSuggestions])

  return (
    <div className="target-search" ref={searchRef}>
      <label className="field">
        <span className="field__label">{label}</span>
        <input
          type="search"
          className="input"
          value={query}
          placeholder={placeholder}
          aria-expanded={showSuggestions}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('')
              setOpen(false)
            }
          }}
        />
      </label>

      {showSuggestions && (
        <ul className="suggestions">
          {suggestions.length === 0 && <li className="suggestions__empty">{T.sidebar.noMatch}</li>}
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="suggestions__item"
                onClick={() => {
                  onPick(item.id)
                  // 追加したら候補は閉じる（続けて足したいときは入力し直す）
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span className="suggestions__label">
                  <ItemIcon id={item.id} name={displayName(item)} size={ROW_ICON} />
                  {displayName(item)}
                </span>
                {addedItems.has(item.id) && (
                  <span className="suggestions__added">{T.sidebar.alreadyAdded}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
