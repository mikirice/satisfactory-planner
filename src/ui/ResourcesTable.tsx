/** 原料表: 必要レート・マップ上限比率・採掘機台数・純度別ノード数。 */
import type { ExtractionPlan, ExtractorGroup, ResourceExtraction, Solution } from '../solver/index.ts'
import {
  fmtClock,
  fmtCount,
  fmtInt,
  fmtPercent,
  fmtPower,
  fmtRate,
  itemName,
  itemUnit,
} from './format.ts'
import { ItemLabel } from './ItemIcon.tsx'
import { T } from './text.ts'

type Props = {
  solution: Solution
  extraction: ExtractionPlan | null
}

export function ResourcesTable({ solution, extraction }: Props) {
  if (solution.rawResources.length === 0) return <p className="hint">{T.resources.empty}</p>
  const byItem = new Map((extraction?.resources ?? []).map((r) => [r.item, r]))

  // シャード列は採掘クロックを 100% 超にしたときだけ出す
  const showShards = (extraction?.totalPowerShards ?? 0) > 0

  return (
    <div className="stack">
      {extraction && <p className="hint">{T.resources.clockNote(fmtClock(extraction.clock))}</p>}
      {extraction && extraction.shortfalls.length > 0 && (
        <p className="callout callout--warn">
          {extraction.shortfalls
            .map((s) => `${s.itemName.ja}: ${T.resources.shortfallNote(fmtRate(s.shortfallPerMin))}`)
            .join(' / ')}
        </p>
      )}
      <section className="card card--wide">
        <div className="table-scroll table-scroll--wide">
          <table className="table">
          <thead>
            <tr>
              <th scope="col">{T.resources.item}</th>
              <th scope="col" className="num">{T.resources.required}</th>
              <th scope="col" className="num">{T.resources.limit}</th>
              <th scope="col" className="num">{T.resources.usage}</th>
              <th scope="col">{T.resources.extractor}</th>
              <th scope="col" className="num">{T.resources.machines}</th>
              <th scope="col">{T.resources.nodes}</th>
              {showShards && <th scope="col" className="num">{T.resources.shards}</th>}
              <th scope="col" className="num">{T.resources.power}</th>
            </tr>
          </thead>
          <tbody>
            {solution.rawResources.map((raw) => {
              const plan = byItem.get(raw.item)
              const groups: ExtractorGroup[] = plan?.groups ?? []
              const span = Math.max(1, groups.length)
              return (
                <ResourceRows
                  key={raw.item}
                  item={raw.item}
                  ratePerMin={raw.ratePerMin}
                  limitPerMin={raw.limitPerMin}
                  usageRatio={raw.usageRatio}
                  plan={plan}
                  groups={groups}
                  span={span}
                  showShards={showShards}
                />
              )
            })}
          </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

type RowsProps = {
  item: string
  ratePerMin: number
  limitPerMin: number | null
  usageRatio: number | null
  plan: ResourceExtraction | undefined
  groups: ExtractorGroup[]
  span: number
  showShards: boolean
}

function ResourceRows({
  item,
  ratePerMin,
  limitPerMin,
  usageRatio,
  plan,
  groups,
  span,
  showShards,
}: RowsProps) {
  const head = (
    <>
      <th scope="row" rowSpan={span}>
        <ItemLabel id={item} name={itemName(item)}>
          <span className="unit"> {itemUnit(item)}</span>
        </ItemLabel>
      </th>
      <td className="num" rowSpan={span}>
        {fmtRate(ratePerMin)}
      </td>
      <td className="num" rowSpan={span}>
        {limitPerMin === null ? T.sidebar.unlimited : fmtInt(limitPerMin)}
      </td>
      <td className="num" rowSpan={span}>
        {fmtPercent(usageRatio)}
      </td>
    </>
  )

  if (groups.length === 0) {
    return (
      <tr>
        {head}
        <td colSpan={showShards ? 4 : 3}>—</td>
        <td className="num">{fmtPower(plan?.powerMW ?? 0)}</td>
      </tr>
    )
  }

  return (
    <>
      {groups.map((group, index) => (
        <tr key={group.extractorId}>
          {index === 0 && head}
          <td>
            {group.extractorName.ja}
            {group.pressurizerCount ? (
              <span className="unit">
                {' '}
                ＋ {T.resources.pressurizer} {fmtInt(group.pressurizerCount)} 台
              </span>
            ) : null}
          </td>
          <td className="num">
            {fmtCount(group.machineCount)}
            <span className="unit"> / 建設 {fmtInt(group.buildingCount)} 台</span>
          </td>
          <td>{nodeBreakdown(group)}</td>
          {showShards && <td className="num">{fmtInt(group.powerShards)}</td>}
          <td className="num">{fmtPower(group.powerMW + (group.pressurizerPowerMW ?? 0))}</td>
        </tr>
      ))}
    </>
  )
}

function nodeBreakdown(group: ExtractorGroup) {
  if (group.assignments.length === 0) return '—'
  if (group.assignments.some((a) => !Number.isFinite(a.availableNodes))) {
    return <span className="unit">{T.resources.unlimitedNodes}</span>
  }
  return (
    <ul className="flow-list">
      {group.assignments.map((assignment) => (
        <li key={assignment.purity}>
          <span className="flow__name">{T.resources.purity[assignment.purity]}</span>
          <span className="flow__rate num">
            {T.resources.nodesOf(fmtCount(assignment.nodes), assignment.availableNodes)}
          </span>
        </li>
      ))}
    </ul>
  )
}
