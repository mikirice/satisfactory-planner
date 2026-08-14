/** 原料上限の編集（未入力はマップ上限）。 */
import { useState } from 'react'

import { MAP_RESOURCE_LIMITS } from '../data/map-limits.ts'
import { usePlanner } from '../store/planner.ts'
import { fmtInt, itemName, itemUnit } from './format.ts'
import { CELL_ICON, ItemIcon } from './ItemIcon.tsx'
import { NumberField } from './NumberField.tsx'
import { T } from './text.ts'

export function LimitsPanel() {
  const overrides = usePlanner((s) => s.limitOverrides)
  const setLimitOverride = usePlanner((s) => s.setLimitOverride)
  const resetLimits = usePlanner((s) => s.resetLimits)
  const [open, setOpen] = useState(false)

  const changed = Object.keys(overrides).length

  return (
    <section className="panel">
      <button type="button" className="panel__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="panel__title">{T.sidebar.limits}</span>
        <span className="panel__meta">
          {changed > 0 ? T.sidebar.limitsChanged(String(changed)) : T.sidebar.mapLimit}
        </span>
        <span className="panel__caret">{open ? T.sidebar.close : T.sidebar.open}</span>
      </button>

      {open && (
        <div className="panel__body">
          <p className="hint">{T.sidebar.limitsHint}</p>
          <button type="button" className="button" onClick={resetLimits}>
            {T.sidebar.limitsReset}
          </button>
          <ul className="limit-list">
            {MAP_RESOURCE_LIMITS.map((limit) => {
              const override = overrides[limit.item]
              const placeholder =
                limit.maxRatePerMin === null ? T.sidebar.unlimited : fmtInt(limit.maxRatePerMin)
              return (
                <li key={limit.item} className="limit">
                  <span className="limit__name">
                    <ItemIcon id={limit.item} name={itemName(limit.item)} size={CELL_ICON} />
                    {itemName(limit.item)}
                  </span>
                  <NumberField
                    className="input input--num"
                    min={0}
                    step={1}
                    value={override}
                    placeholder={placeholder}
                    aria-label={`${itemName(limit.item)} ${T.sidebar.limits}`}
                    onValueChange={(value) => setLimitOverride(limit.item, value)}
                    onEmpty={() => setLimitOverride(limit.item, undefined)}
                  />
                  <span className="unit">{itemUnit(limit.item)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
