/** 目標産出の編集（アイテム検索＋レート入力）。 */
import { useMemo, useState } from 'react'

import { items } from '../data/index.ts'
import { usePlanner } from '../store/planner.ts'
import { itemName, itemUnit } from './format.ts'
import { T } from './text.ts'

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

  const suggestions = useMemo(() => {
    if (query.trim() === '') return []
    return searchableItems
      .filter((i) => matches(query, [i.name.ja, i.name.en, i.id]))
      .slice(0, MAX_SUGGESTIONS)
  }, [query])

  return (
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.targets}</h2>

      <label className="field">
        <span className="field__label">{T.sidebar.targetSearch}</span>
        <input
          type="search"
          className="input"
          value={query}
          placeholder={T.sidebar.targetSearchPlaceholder}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {query.trim() !== '' && (
        <ul className="suggestions">
          {suggestions.length === 0 && <li className="suggestions__empty">{T.sidebar.noMatch}</li>}
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="suggestions__item"
                onClick={() => {
                  addTarget(item.id)
                  setQuery('')
                }}
              >
                {item.name.ja}
              </button>
            </li>
          ))}
        </ul>
      )}

      {targets.length === 0 ? (
        <p className="hint">{T.sidebar.targetEmpty}</p>
      ) : (
        <ul className="target-list">
          {targets.map((target) => (
            <li key={target.key} className="target">
              <span className="target__name">{itemName(target.item)}</span>
              <span className="target__rate">
                <input
                  type="number"
                  className="input input--num"
                  min={0}
                  step={1}
                  value={target.ratePerMin}
                  aria-label={T.sidebar.targetRate}
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
    </section>
  )
}
