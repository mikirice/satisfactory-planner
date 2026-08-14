/**
 * 目標産出の編集（アイテム検索＋レート入力／産出の最大化）。
 *
 * 各行は「レート指定」か「最大化」のどちらか。最大化は原料上限まで作れるだけ作るので、
 * 同時に選べるのは1行だけ（store 側で他の行を自動的にレート指定へ戻す）。
 * 最大化中もレートの値は保持し、切り戻したときに元の数字へ戻れるようにしてある。
 */
import { useMemo, useRef } from 'react'

import { usePlanner } from '../store/planner.ts'
import { itemName, itemUnit } from './format.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { ItemSearchBox, ROW_ICON } from './ItemSearchBox.tsx'
import { NumberField } from './NumberField.tsx'
import { T } from './text.ts'

export function TargetsPanel() {
  const targets = usePlanner((s) => s.targets)
  const addTarget = usePlanner((s) => s.addTarget)
  const updateTarget = usePlanner((s) => s.updateTarget)
  const removeTarget = usePlanner((s) => s.removeTarget)
  const setTargetMode = usePlanner((s) => s.setTargetMode)
  // 行の key → レート入力欄。追加済みアイテムを選んだときに移動先として使う
  const rateInputs = useRef(new Map<string, HTMLInputElement>())

  const addedItems = useMemo(() => new Set(targets.map((t) => t.item)), [targets])

  return (
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.targets}</h2>

      <ItemSearchBox
        label={T.sidebar.targetSearch}
        placeholder={T.sidebar.targetSearchPlaceholder}
        addedItems={addedItems}
        onPick={(itemId) => {
          const key = addTarget(itemId)
          // 追加済みなら行は増えない。黙って何も起きないように見えるので、
          // 既にある行のレート入力へフォーカスを移して所在を示す
          rateInputs.current.get(key)?.focus()
        }}
      />

      <div className="target-group">
        <p className="target-group__head">{T.sidebar.targetListHeading}</p>
        {targets.length === 0 ? (
          <p className="hint">{T.sidebar.targetEmpty}</p>
        ) : (
          <ul className="target-list">
            {targets.map((target) => {
              const isMax = target.mode === 'max'
              return (
                <li key={target.key} className={`target${isMax ? ' target--max' : ''}`}>
                  <span className="target__name">
                    <ItemIcon id={target.item} name={itemName(target.item)} size={ROW_ICON} />
                    {itemName(target.item)}
                  </span>
                  {/* 操作はひとかたまり。名前が長い行では丸ごと2段目へ折り返す */}
                  <span className="target__controls">
                    {isMax ? (
                      <span className="target__rate target__rate--max">
                        {T.sidebar.maximizeBadge}
                      </span>
                    ) : (
                      <span className="target__rate">
                        <NumberField
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
                          onValueChange={(ratePerMin) =>
                            updateTarget(target.key, { ratePerMin })
                          }
                        />
                        <span className="unit">{itemUnit(target.item)}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      className="button button--quiet"
                      onClick={() => removeTarget(target.key)}
                    >
                      {T.sidebar.remove}
                    </button>
                  </span>
                  <label className="target__mode" title={T.sidebar.maximizeHint}>
                    <input
                      type="checkbox"
                      checked={isMax}
                      onChange={(e) =>
                        setTargetMode(target.key, e.target.checked ? 'max' : 'rate')
                      }
                    />
                    {T.sidebar.maximize}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        {targets.some((t) => t.mode === 'max') && (
          <p className="hint">{T.sidebar.maximizeHint}</p>
        )}
      </div>
    </section>
  )
}
