/**
 * 既にあるアイテム（手持ち在庫・別工場からの供給）の編集。
 *
 * ここに入れた分はコスト0の外部供給としてソルバーに渡り、原料の採掘より優先して使われる。
 * 使い切るとは限らない（必要な分しか引き込まない）ので、実際に使われた量は
 * 結果のサマリーに出す。目標産出と同じく1アイテム1行。
 */
import { useMemo, useRef } from 'react'

import { usePlanner } from '../store/planner.ts'
import { CollapsiblePanel } from './CollapsiblePanel.tsx'
import { itemName, itemUnit } from './format.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { ItemSearchBox, ROW_ICON } from './ItemSearchBox.tsx'
import { NumberField } from './NumberField.tsx'
import { T } from './text.ts'

export function InputsPanel() {
  const inputs = usePlanner((s) => s.inputs)
  const addInput = usePlanner((s) => s.addInput)
  const updateInput = usePlanner((s) => s.updateInput)
  const removeInput = usePlanner((s) => s.removeInput)
  const rateInputs = useRef(new Map<string, HTMLInputElement>())

  const addedItems = useMemo(() => new Set(inputs.map((i) => i.item)), [inputs])

  return (
    <CollapsiblePanel title={T.sidebar.stock}>
      <ItemSearchBox
        label={T.sidebar.stockSearch}
        placeholder={T.sidebar.stockSearchPlaceholder}
        addedItems={addedItems}
        onPick={(itemId) => {
          const key = addInput(itemId)
          rateInputs.current.get(key)?.focus()
        }}
      />

      <div className="target-group">
        <p className="target-group__head">{T.sidebar.stockListHeading}</p>
        {inputs.length === 0 ? (
          <p className="hint">{T.sidebar.stockEmpty}</p>
        ) : (
          <>
            <ul className="target-list">
              {inputs.map((input) => (
                <li key={input.key} className="stock">
                  <span className="target__name">
                    <ItemIcon id={input.item} name={itemName(input.item)} size={ROW_ICON} />
                    {itemName(input.item)}
                  </span>
                  <span className="target__rate">
                    <NumberField
                      className="input input--num"
                      min={0}
                      step={1}
                      value={input.ratePerMin}
                      aria-label={T.sidebar.stockRate}
                      ref={(el) => {
                        if (el === null) return
                        rateInputs.current.set(input.key, el)
                        return () => {
                          rateInputs.current.delete(input.key)
                        }
                      }}
                      onValueChange={(ratePerMin) =>
                        updateInput(input.key, { ratePerMin })
                      }
                    />
                    <span className="unit">{itemUnit(input.item)}</span>
                  </span>
                  <button
                    type="button"
                    className="button button--quiet"
                    onClick={() => removeInput(input.key)}
                  >
                    {T.sidebar.remove}
                  </button>
                </li>
              ))}
            </ul>
            <p className="hint">{T.sidebar.stockHint}</p>
          </>
        )}
      </div>
    </CollapsiblePanel>
  )
}
