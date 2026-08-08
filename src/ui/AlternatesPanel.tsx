/** 代替レシピの一括／個別 ON・OFF。 */
import { useMemo, useState } from 'react'

import { alternateRecipes, usePlanner } from '../store/planner.ts'
import { stripAlternatePrefix } from './format.ts'
import { T } from './text.ts'

export function AlternatesPanel() {
  const enabled = usePlanner((s) => s.enabledAlternates)
  const setAlternate = usePlanner((s) => s.setAlternate)
  const setAllAlternates = usePlanner((s) => s.setAllAlternates)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  // このパネルは全行が代替レシピなので、行頭の目印（ハードドライブ）と「代替: 」は
  // 冗長なだけ。表示名からは落とし、検索は落とす前後どちらの文字列にも当てる。
  const rows = useMemo(
    () =>
      alternateRecipes.map((recipe) => {
        const ja = stripAlternatePrefix(recipe.name.ja)
        const en = stripAlternatePrefix(recipe.name.en)
        return {
          recipe,
          label: ja,
          haystack: [recipe.name.ja, recipe.name.en, ja, en].join('\n').toLowerCase(),
        }
      }),
    [],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return rows
    return rows.filter((row) => row.haystack.includes(q))
  }, [query, rows])

  const onCount = Object.keys(enabled).length

  return (
    <section className="panel">
      <button type="button" className="panel__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="panel__title">{T.sidebar.alternates}</span>
        <span className="panel__meta">{T.sidebar.alternatesCount(onCount, alternateRecipes.length)}</span>
        <span className="panel__caret">{open ? '閉じる' : '開く'}</span>
      </button>

      {open && (
        <div className="panel__body">
          <div className="button-row">
            <button type="button" className="button" onClick={() => setAllAlternates(true)}>
              {T.sidebar.enableAll}
            </button>
            <button type="button" className="button" onClick={() => setAllAlternates(false)}>
              {T.sidebar.disableAll}
            </button>
          </div>
          <input
            type="search"
            className="input"
            value={query}
            placeholder={T.sidebar.alternatesSearchPlaceholder}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="check-list">
            {visible.map(({ recipe, label }) => (
              <li key={recipe.id}>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={enabled[recipe.id] === true}
                    onChange={(e) => setAlternate(recipe.id, e.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
