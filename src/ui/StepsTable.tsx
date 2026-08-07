/** 生産ステップ表（機械種別でグルーピング）。 */
import { buildingsById } from '../data/index.ts'
import type { Solution, SolutionStep } from '../solver/index.ts'
import { fmtCount, fmtPower, fmtPowerRange, fmtRate, itemName } from './format.ts'
import { T } from './text.ts'

type Props = { solution: Solution }

type Group = {
  buildingId: string
  buildingNameJa: string
  steps: SolutionStep[]
  machineCount: number
  buildingCount: number
  powerMW: number
}

export function StepsTable({ solution }: Props) {
  if (solution.steps.length === 0) return <p className="hint">{T.steps.empty}</p>
  const groups = groupByBuilding(solution.steps)

  return (
    <div className="stack">
      <p className="hint">{T.steps.variablePowerNote}</p>
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
                <th scope="col" className="num">{T.steps.power}</th>
                <th scope="col">{T.steps.inputs}</th>
                <th scope="col">{T.steps.outputs}</th>
              </tr>
            </thead>
            <tbody>
              {group.steps.map((step) => {
                const built = builtCount(step.machineCount)
                const clock = built === 0 ? 0 : step.machineCount / built
                return (
                  <tr key={step.recipeId}>
                    <th scope="row">{step.recipeName.ja}</th>
                    <td className="num">{fmtCount(step.machineCount)}</td>
                    <td className="num">
                      {built} 台 @ {(clock * 100).toFixed(1)}%
                    </td>
                    <td className="num">
                      {step.powerRangeMW
                        ? fmtPowerRange(step.powerRangeMW.minMW, step.powerRangeMW.maxMW)
                        : fmtPower(step.powerMW)}
                    </td>
                    <td className="flows">{flowList(step.inputs)}</td>
                    <td className="flows">{flowList(step.outputs)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{T.steps.subtotal}</th>
                <td className="num">{fmtCount(group.machineCount)}</td>
                <td className="num">{group.buildingCount} 台</td>
                <td className="num">{fmtPower(group.powerMW)}</td>
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
          <span className="flow__name">{itemName(rate.item)}</span>
          <span className="flow__rate num">{fmtRate(rate.ratePerMin)}</span>
        </li>
      ))}
    </ul>
  )
}

function builtCount(machineCount: number): number {
  return machineCount <= 0 ? 0 : Math.max(1, Math.ceil(machineCount - 1e-9))
}

function groupByBuilding(steps: readonly SolutionStep[]): Group[] {
  const groups = new Map<string, Group>()
  for (const step of steps) {
    let group = groups.get(step.buildingId)
    if (!group) {
      group = {
        buildingId: step.buildingId,
        buildingNameJa: buildingsById.get(step.buildingId)?.name.ja ?? step.buildingName.ja,
        steps: [],
        machineCount: 0,
        buildingCount: 0,
        powerMW: 0,
      }
      groups.set(step.buildingId, group)
    }
    group.steps.push(step)
    group.machineCount += step.machineCount
    group.buildingCount += builtCount(step.machineCount)
    group.powerMW += step.powerMW
  }
  return [...groups.values()].sort(
    (a, b) => b.powerMW - a.powerMW || a.buildingId.localeCompare(b.buildingId),
  )
}
