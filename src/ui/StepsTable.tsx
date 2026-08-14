/** 生産ステップ表（機械種別でグルーピング）。 */
import { useMemo } from 'react'

import { groupByBuilding, stepKey } from '../plan/aggregate.ts'
import { findPowerOnlySteps, visibleSteps } from '../plan/power-filter.ts'
import type { Solution } from '../solver/index.ts'
import {
  fmtClock,
  fmtCount,
  fmtInt,
  fmtPower,
  fmtPowerRange,
  fmtRate,
  isAlternateRecipe,
  itemName,
} from './format.ts'
import { AlternateIcon, ItemIcon, ItemNameLink } from './ItemIcon.tsx'
import { PowerFilterToggle } from './PowerFilterToggle.tsx'
import { T } from './text.ts'

type Props = {
  solution: Solution
  /** 発電関連を表示から外すか（表示だけの絞り込み。既定 false） */
  hidePower?: boolean
  onHidePowerChange?: (next: boolean) => void
}

/** 表の中のアイコン(px)。行送り（13px文字）を押し広げない大きさに留める */
const CELL_ICON = 16

export function StepsTable({ solution, hidePower = false, onHidePowerChange }: Props) {
  // 発電計画が無効な解ではトグルそのものを出さない
  const canFilterPower = solution.powerGeneration !== undefined
  const filter = useMemo(() => findPowerOnlySteps(solution), [solution])
  const steps = hidePower && canFilterPower ? visibleSteps(solution.steps, filter) : solution.steps

  const toggle = canFilterPower ? (
    <PowerFilterToggle
      hidePower={hidePower}
      hiddenStepCount={filter.hiddenStepCount}
      onChange={onHidePowerChange}
    />
  ) : null

  if (steps.length === 0) {
    // 全部隠したときもトグルは残す（戻せなくなるので）
    return (
      <div className="stack">
        {toggle}
        <p className="hint">{T.steps.empty}</p>
      </div>
    )
  }

  const groups = groupByBuilding(steps)
  // シャード列・Somersloop 列・発電量列は使うときだけ出す（既定では表を細くしておく）
  // 隠したステップぶんは列ごと消す（発電を隠したら発電量の列も要らない）
  const showShards = steps.some((s) => s.powerShards > 0)
  const showSomersloops = steps.some((s) => s.somersloops > 0)
  const showPowerProduction = steps.some((s) => (s.powerProductionMW ?? 0) > 0)

  return (
    <div className="stack">
      {toggle}
      <p className="hint">{T.steps.clockNote(fmtClock(solution.maxClock))}</p>
      <p className="hint">{T.steps.variablePowerNote}</p>
      {showPowerProduction && <p className="hint">{T.steps.powerGroupNote}</p>}
      {groups.map((group) => (
        <section className="card card--wide" key={group.buildingId}>
          <h3 className="card__title">
            {itemName(group.buildingId)}
            <span className="card__meta">{T.steps.groupCount(group.steps.length)}</span>
          </h3>
          <div className="table-scroll table-scroll--wide">
            <table className="table">
            <thead>
              <tr>
                <th scope="col">{T.steps.recipe}</th>
                <th scope="col" className="num">{T.steps.machineCount}</th>
                <th scope="col" className="num">{T.steps.clock}</th>
                {showShards && <th scope="col" className="num">{T.steps.shards}</th>}
                {showSomersloops && (
                  <th scope="col" className="num">{T.steps.somersloops}</th>
                )}
                <th scope="col" className="num">{T.steps.power}</th>
                {showPowerProduction && (
                  <th scope="col" className="num">{T.steps.powerProductionHead}</th>
                )}
                <th scope="col">{T.steps.inputs}</th>
                <th scope="col">{T.steps.outputs}</th>
              </tr>
            </thead>
            <tbody>
              {group.steps.map((step) => (
                <tr key={stepKey(step)}>
                  <th scope="row">
                    {/* 代替レシピはハードドライブのアイコンを先頭に添える（文字の「代替: 」は残す） */}
                    <span className="cell-name">
                      {isAlternateRecipe(step.recipeId) && <AlternateIcon size={CELL_ICON} />}
                      <span>{itemName(step.recipeId)}</span>
                    </span>
                  </th>
                  <td className="num">{fmtCount(step.machineCount)}</td>
                  <td className="num">
                    {T.steps.builtClock(String(step.builtCount), fmtClock(step.clockSpeed))}
                  </td>
                  {showShards && <td className="num">{fmtInt(step.powerShards)}</td>}
                  {showSomersloops && (
                    <td className="num">
                      {step.somersloops > 0 ? (
                        <span className="tag is-accent">
                          {T.steps.somersloopBadge(step.somersloops)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td className="num">
                    {step.clockedPowerRangeMW
                      ? fmtPowerRange(
                          step.clockedPowerRangeMW.minMW,
                          step.clockedPowerRangeMW.maxMW,
                        )
                      : fmtPower(step.clockedPowerMW)}
                  </td>
                  {showPowerProduction && (
                    <td className="num">
                      {(step.powerProductionMW ?? 0) > 0 ? (
                        <span className="tag is-accent">
                          {T.steps.powerProduction(fmtPower(step.powerProductionMW ?? 0))}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  <td className="flows">{flowList(step.inputs)}</td>
                  <td className="flows">{flowList(step.outputs)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{T.steps.subtotal}</th>
                <td className="num">{fmtCount(group.machineCount)}</td>
                <td className="num">{T.steps.buildingCount(String(group.buildingCount))}</td>
                {showShards && <td className="num">{fmtInt(group.powerShards)}</td>}
                {showSomersloops && <td className="num">{fmtInt(group.somersloops)}</td>}
                <td className="num">{fmtPower(group.powerMW)}</td>
                {showPowerProduction && (
                  <td className="num">
                    {group.powerProductionMW > 0
                      ? T.steps.powerProduction(fmtPower(group.powerProductionMW))
                      : '—'}
                  </td>
                )}
                <td />
                <td />
              </tr>
            </tfoot>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}

function flowList(rates: { item: string; ratePerMin: number }[]) {
  return (
    <ul className="flow-list">
      {rates.map((rate) => (
        <li key={rate.item}>
          <span className="flow__name">
            <ItemIcon id={rate.item} name={itemName(rate.item)} size={CELL_ICON} />
            <ItemNameLink id={rate.item}>{itemName(rate.item)}</ItemNameLink>
          </span>
          <span className="flow__rate num">{fmtRate(rate.ratePerMin)}</span>
        </li>
      ))}
    </ul>
  )
}
