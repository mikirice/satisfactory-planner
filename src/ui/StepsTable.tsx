/** 生産ステップ表（機械種別でグルーピング）。 */
import { groupByBuilding, stepKey } from '../plan/aggregate.ts'
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
import { AlternateIcon, ItemIcon } from './ItemIcon.tsx'
import { T } from './text.ts'

type Props = { solution: Solution }

/** 表の中のアイコン(px)。行送り（13px文字）を押し広げない大きさに留める */
const CELL_ICON = 16

export function StepsTable({ solution }: Props) {
  if (solution.steps.length === 0) return <p className="hint">{T.steps.empty}</p>
  const groups = groupByBuilding(solution.steps)
  // シャード列・Somersloop 列・発電量列は使うときだけ出す（既定では表を細くしておく）
  const showShards = solution.totalPowerShards > 0
  const showSomersloops = solution.totalSomersloops > 0
  const showPowerProduction = solution.steps.some((s) => (s.powerProductionMW ?? 0) > 0)

  return (
    <div className="stack">
      <p className="hint">{T.steps.clockNote(fmtClock(solution.maxClock))}</p>
      <p className="hint">{T.steps.variablePowerNote}</p>
      {showPowerProduction && <p className="hint">{T.steps.powerGroupNote}</p>}
      {groups.map((group) => (
        <section className="card card--wide" key={group.buildingId}>
          <h3 className="card__title">
            {group.buildingNameJa}
            <span className="card__meta">{T.steps.groupCount(group.steps.length)}</span>
          </h3>
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
                      <span>{step.recipeName.ja}</span>
                    </span>
                  </th>
                  <td className="num">{fmtCount(step.machineCount)}</td>
                  <td className="num">
                    {step.builtCount} 台 @ {fmtClock(step.clockSpeed)}
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
                <td className="num">{group.buildingCount} 台</td>
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
            {itemName(rate.item)}
          </span>
          <span className="flow__rate num">{fmtRate(rate.ratePerMin)}</span>
        </li>
      ))}
    </ul>
  )
}
