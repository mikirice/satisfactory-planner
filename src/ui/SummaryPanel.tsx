/** サマリー: 総電力（幅表示＋製造/採掘内訳）・建物数・建設コスト・シンクポイント・副産物。 */
import type { ExtractionPlan, Solution } from '../solver/index.ts'
import { fmtCount, fmtInt, fmtPower, fmtPowerRange, fmtRate, itemName, itemUnit } from './format.ts'
import { T } from './text.ts'

type Props = {
  solution: Solution
  extraction: ExtractionPlan | null
}

export function SummaryPanel({ solution, extraction }: Props) {
  const extractionPowerMW = extraction?.totalPowerMW ?? 0
  const totalMinMW = solution.totalPowerRangeMW.minMW + extractionPowerMW
  const totalMaxMW = solution.totalPowerRangeMW.maxMW + extractionPowerMW

  const buildCost = mergeBuildCost(solution, extraction)

  return (
    <div className="cards">
      <section className="card">
        <h3 className="card__title">{T.summary.targets}</h3>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{T.balance.item}</th>
              <th scope="col" className="num">{T.summary.requested}</th>
              <th scope="col" className="num">{T.summary.produced}</th>
            </tr>
          </thead>
          <tbody>
            {solution.targets.map((target) => (
              <tr key={target.item}>
                <th scope="row">{itemName(target.item)}</th>
                <td className="num">{fmtRate(target.requestedPerMin)}</td>
                <td className="num">{fmtRate(target.producedPerMin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3 className="card__title">{T.summary.power}</h3>
        <p className="bignum">
          {fmtPowerRange(totalMinMW, totalMaxMW)} <span className="bignum__unit">{T.summary.unit.mw}</span>
        </p>
        <dl className="kv">
          <dt>{T.summary.powerManufacturing}</dt>
          <dd className="num">
            {fmtPowerRange(solution.totalPowerRangeMW.minMW, solution.totalPowerRangeMW.maxMW)}{' '}
            {T.summary.unit.mw}
          </dd>
          <dt>{T.summary.powerExtraction}</dt>
          <dd className="num">
            {fmtPower(extractionPowerMW)} {T.summary.unit.mw}
          </dd>
        </dl>
      </section>

      <section className="card">
        <h3 className="card__title">{T.summary.machines}</h3>
        <p className="bignum">
          {fmtInt(solution.totalBuildingCount)} <span className="bignum__unit">{T.summary.unit.count}</span>
        </p>
        <dl className="kv">
          <dt>{T.summary.machineCountRunning}</dt>
          <dd className="num">{fmtCount(solution.totalMachineCount)}</dd>
          <dt>{T.summary.machineCountBuilt}</dt>
          <dd className="num">{fmtInt(solution.totalBuildingCount)}</dd>
          <dt>{T.summary.extractorCount}</dt>
          <dd className="num">{fmtInt(extraction?.totalBuildingCount ?? 0)}</dd>
        </dl>
      </section>

      <section className="card">
        <h3 className="card__title">{T.summary.sinkPoints}</h3>
        <p className="bignum">
          {fmtInt(solution.sinkPointsPerMin)}{' '}
          <span className="bignum__unit">{T.summary.sinkPointsUnit}</span>
        </p>
        <h4 className="card__subtitle">{T.summary.byproducts}</h4>
        {solution.byproducts.length === 0 ? (
          <p className="hint">{T.summary.byproductsEmpty}</p>
        ) : (
          <table className="table">
            <tbody>
              {solution.byproducts.map((b) => (
                <tr key={b.item}>
                  <th scope="row">{itemName(b.item)}</th>
                  <td className="num">{fmtRate(b.ratePerMin)}</td>
                  <td className="unit-cell">{itemUnit(b.item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card card--wide">
        <h3 className="card__title">{T.summary.buildCost}</h3>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{T.balance.item}</th>
              <th scope="col" className="num">{T.summary.buildCostManufacturing}</th>
              <th scope="col" className="num">{T.summary.buildCostExtraction}</th>
              <th scope="col" className="num">合計</th>
            </tr>
          </thead>
          <tbody>
            {buildCost.map((row) => (
              <tr key={row.item}>
                <th scope="row">{itemName(row.item)}</th>
                <td className="num">{fmtInt(row.manufacturing)}</td>
                <td className="num">{fmtInt(row.extraction)}</td>
                <td className="num strong">{fmtInt(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {solution.externalInputs.length > 0 && (
        <section className="card">
          <h3 className="card__title">{T.summary.externalInputs}</h3>
          <table className="table">
            <tbody>
              {solution.externalInputs.map((input) => (
                <tr key={input.item}>
                  <th scope="row">{itemName(input.item)}</th>
                  <td className="num">{fmtRate(input.ratePerMin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

type BuildCostRow = { item: string; manufacturing: number; extraction: number; total: number }

function mergeBuildCost(solution: Solution, extraction: ExtractionPlan | null): BuildCostRow[] {
  const rows = new Map<string, BuildCostRow>()
  const rowFor = (item: string): BuildCostRow => {
    let row = rows.get(item)
    if (!row) {
      row = { item, manufacturing: 0, extraction: 0, total: 0 }
      rows.set(item, row)
    }
    return row
  }
  for (const cost of solution.totalBuildCost) rowFor(cost.item).manufacturing += cost.amount
  for (const cost of extraction?.totalBuildCost ?? []) rowFor(cost.item).extraction += cost.amount
  for (const row of rows.values()) row.total = row.manufacturing + row.extraction
  return [...rows.values()].sort((a, b) => b.total - a.total || a.item.localeCompare(b.item))
}
