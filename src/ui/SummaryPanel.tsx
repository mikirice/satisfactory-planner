/**
 * サマリー: 総電力（幅表示＋製造/採掘内訳）・建物数・パワーシャード・Somersloop・
 * 概算床面積・建設コスト・シンクポイント・副産物。
 *
 * 電力の主表示は「クロック適用後」。LP の目的関数が使う100%換算の値も
 * 内訳に並べる（クロックを変えたときにどれだけ増減したかが分かるように）。
 */
import { estimateFootprint, mergeBuildCost } from '../plan/aggregate.ts'
import type { ExtractionPlan, Solution } from '../solver/index.ts'
import {
  fmtArea,
  fmtCount,
  fmtInt,
  fmtPower,
  fmtPowerRange,
  fmtRate,
  itemName,
  itemUnit,
} from './format.ts'
import { T } from './text.ts'

type Props = {
  solution: Solution
  extraction: ExtractionPlan | null
}

export function SummaryPanel({ solution, extraction }: Props) {
  const extractionPowerMW = extraction?.totalPowerMW ?? 0
  const totalMinMW = solution.totalClockedPowerRangeMW.minMW + extractionPowerMW
  const totalMaxMW = solution.totalClockedPowerRangeMW.maxMW + extractionPowerMW

  const buildCost = mergeBuildCost(solution, extraction)
  const footprint = estimateFootprint(solution, extraction)
  const totalPowerShards = solution.totalPowerShards + (extraction?.totalPowerShards ?? 0)
  const somersloopsOver = solution.totalSomersloops > solution.somersloopLimit

  return (
    <div className="cards">
      <section className="card">
        <h3 className="card__title">{T.summary.targets}</h3>
        {solution.maximizedOutput && (
          <p className="callout callout--accent">
            {T.summary.maximizedResult(
              itemName(solution.maximizedOutput.item),
              fmtRate(solution.maximizedOutput.ratePerMin),
              itemUnit(solution.maximizedOutput.item),
            )}
          </p>
        )}
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
                <td className="num">
                  {target.maximized ? (
                    <span className="tag is-accent">{T.summary.maximized}</span>
                  ) : (
                    fmtRate(target.requestedPerMin)
                  )}
                </td>
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
            {fmtPowerRange(
              solution.totalClockedPowerRangeMW.minMW,
              solution.totalClockedPowerRangeMW.maxMW,
            )}{' '}
            {T.summary.unit.mw}
          </dd>
          <dt>{T.summary.powerManufacturingNominal}</dt>
          <dd className="num">
            {fmtPowerRange(solution.totalPowerRangeMW.minMW, solution.totalPowerRangeMW.maxMW)}{' '}
            {T.summary.unit.mw}
          </dd>
          <dt>{T.summary.powerExtraction}</dt>
          <dd className="num">
            {fmtPower(extractionPowerMW)} {T.summary.unit.mw}
          </dd>
          <dt>{T.summary.powerShards}</dt>
          <dd className="num">
            {fmtInt(totalPowerShards)} {T.summary.powerShardsUnit}
          </dd>
        </dl>
      </section>

      {solution.somersloopLimit > 0 && (
        <section className="card">
          <h3 className="card__title">{T.summary.somersloops}</h3>
          <p className="bignum">
            {fmtInt(solution.totalSomersloops)}{' '}
            <span className="bignum__unit">{T.summary.somersloopsUnit}</span>
          </p>
          <dl className="kv">
            <dt>{T.summary.somersloopsUsed}</dt>
            <dd className="num">{fmtInt(solution.totalSomersloops)}</dd>
            <dt>{T.summary.somersloopsLimit}</dt>
            <dd className="num">{fmtInt(solution.somersloopLimit)}</dd>
          </dl>
          {/* 端数の台数を切り上げるので、フル装着に必要な数が上限を超えることがある */}
          {somersloopsOver && (
            <p className="callout callout--warn">
              {T.sidebar.somersloopsOver(solution.totalSomersloops, solution.somersloopLimit)}
            </p>
          )}
          {solution.totalSomersloops === 0 && (
            <p className="hint">{T.summary.somersloopsUnused}</p>
          )}
        </section>
      )}

      <section className="card">
        <h3 className="card__title">{T.summary.footprint}</h3>
        <p className="bignum">
          {fmtArea(footprint.totalAreaM2)}{' '}
          <span className="bignum__unit">{T.summary.footprintUnit}</span>
        </p>
        <p className="hint">{T.summary.footprintFoundations(fmtInt(footprint.foundations))}</p>
        <dl className="kv">
          <dt>{T.summary.footprintManufacturing}</dt>
          <dd className="num">
            {fmtArea(footprint.manufacturingAreaM2)} {T.summary.footprintUnit}
          </dd>
          <dt>{T.summary.footprintExtraction}</dt>
          <dd className="num">
            {fmtArea(footprint.extractionAreaM2)} {T.summary.footprintUnit}
          </dd>
          <dt>{T.summary.footprintBuildings}</dt>
          <dd className="num">
            {fmtArea(footprint.buildingAreaM2)} {T.summary.footprintUnit}
          </dd>
        </dl>
        <p className="hint">{T.summary.footprintAisle(String(footprint.aisleFactor))}</p>
        <p className="hint">{T.summary.footprintNote}</p>
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
            <thead>
              <tr>
                <th scope="col">{T.balance.item}</th>
                <th scope="col" className="num">{T.summary.externalInputsAvailable}</th>
                <th scope="col" className="num">{T.summary.externalInputsUsed}</th>
                <th scope="col">{T.balance.state}</th>
              </tr>
            </thead>
            <tbody>
              {/* 全量が使われるとは限らないので「投入 / 使用」を並べて出す */}
              {solution.externalInputs.map((input) => (
                <tr key={input.item}>
                  <th scope="row">{itemName(input.item)}</th>
                  <td className="num">{fmtRate(input.availablePerMin)}</td>
                  <td className="num">{fmtRate(input.ratePerMin)}</td>
                  <td>
                    {input.ratePerMin <= 0 ? (
                      <span className="tag is-balanced">{T.summary.externalInputsUnused}</span>
                    ) : (
                      <span className="unit-cell">{itemUnit(input.item)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

