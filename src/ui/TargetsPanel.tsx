/**
 * 目標産出の編集（アイテム検索＋レート入力）。
 *
 * 検索候補は **検索欄に紐づいたドロップダウン**（重ねて出す）。以前は候補を通常の
 * 流れの中に置いていたため、追加した後も候補が目標一覧のすぐ上に残り、
 * 「候補」と「追加済みの目標」の区別が付かなかった（例: 強化鉄板を追加したのに
 * 「鉄板」も目標に入っていると誤解する）。選んだら閉じる・Escape / 外側クリックでも
 * 閉じる・目標一覧は見出し付きの別ブロックにする、の3点で切り分ける。
 */
import { useEffect, useMemo, useRef, useState } from 'react'

import { items } from '../data/index.ts'
import { usePlanner } from '../store/planner.ts'
import { itemName, itemUnit } from './format.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { T } from './text.ts'

/** 候補・目標一覧のアイコンサイズ(px)。文字（13〜14px）に対して主張しすぎない大きさ */
const ROW_ICON = 20

/** 候補の表示上限。多すぎると選びにくいので絞る */
const MAX_SUGGESTIONS = 12

const searchableItems = [...items].sort((a, b) => a.name.ja.localeCompare(b.name.ja, 'ja'))

function matches(query: string, haystack: string[]): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return false
  return haystack.some((h) => h.toLowerCase().includes(q))
}

export function TargetsPanel() {
  const targets = usePlanner((s) => s.targets)
  const addTarget = usePlanner((s) => s.addTarget)
  const updateTarget = usePlanner((s) => s.updateTarget)
  const removeTarget = usePlanner((s) => s.removeTarget)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  // 行の key → レート入力欄。追加済みアイテムを選んだときに移動先として使う
  const rateInputs = useRef(new Map<string, HTMLInputElement>())

  const suggestions = useMemo(() => {
    if (query.trim() === '') return []
    return searchableItems
      .filter((i) => matches(query, [i.name.ja, i.name.en, i.id]))
      .slice(0, MAX_SUGGESTIONS)
  }, [query])

  const addedItems = useMemo(() => new Set(targets.map((t) => t.item)), [targets])
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
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.targets}</h2>

      <div className="target-search" ref={searchRef}>
        <label className="field">
          <span className="field__label">{T.sidebar.targetSearch}</span>
          <input
            type="search"
            className="input"
            value={query}
            placeholder={T.sidebar.targetSearchPlaceholder}
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
            {suggestions.length === 0 && (
              <li className="suggestions__empty">{T.sidebar.noMatch}</li>
            )}
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="suggestions__item"
                  onClick={() => {
                    const key = addTarget(item.id)
                    // 追加したら候補は閉じる（続けて足したいときは入力し直す）
                    setQuery('')
                    setOpen(false)
                    // 追加済みなら行は増えない。黙って何も起きないように見えるので、
                    // 既にある行のレート入力へフォーカスを移して所在を示す
                    rateInputs.current.get(key)?.focus()
                  }}
                >
                  <span className="suggestions__label">
                    <ItemIcon id={item.id} name={item.name.ja} size={ROW_ICON} />
                    {item.name.ja}
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

      <div className="target-group">
        <p className="target-group__head">{T.sidebar.targetListHeading}</p>
        {targets.length === 0 ? (
          <p className="hint">{T.sidebar.targetEmpty}</p>
        ) : (
          <ul className="target-list">
            {targets.map((target) => (
              <li key={target.key} className="target">
                <span className="target__name">
                  <ItemIcon id={target.item} name={itemName(target.item)} size={ROW_ICON} />
                  {itemName(target.item)}
                </span>
                <span className="target__rate">
                  <input
                    type="number"
                    className="input input--num"
                    min={0}
                    step={1}
                    value={target.ratePerMin}
                    aria-label={T.sidebar.targetRate}
                    ref={(el) => {
                      if (el === null) return
                      rateInputs.current.set(target.key, el)
                      return () => {
                        rateInputs.current.delete(target.key)
                      }
                    }}
                    onChange={(e) =>
                      updateTarget(target.key, { ratePerMin: Number(e.target.value) || 0 })
                    }
                  />
                  <span className="unit">{itemUnit(target.item)}</span>
                </span>
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => removeTarget(target.key)}
                >
                  {T.sidebar.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
