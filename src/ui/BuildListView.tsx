/**
 * 建設リスト（計画書「建設チェックリスト（建設モード）」§2・§4・§5 を読み取り専用に縮めたもの）。
 *
 * 用途は「何を・何台建てるのかを一覧で見る」こと。ブラウザ上で消し込んでも実際の建設は進まない
 * ので、チェック・カウンター・進捗の保存は持たない（2026-08-29 の方針転換）。数字と並びの導出は
 * src/plan/build-list.ts にあり、ここは表示だけを持つ（解には一切触らない）。
 */
import { useMemo } from 'react'
import { useLocale } from '../i18n/index.ts'
import { buildingCapacityText } from '../i18n/building-capacity.ts'

import { deriveBuildList } from '../plan/build-list.ts'
import type { BuildListItem, BuildTransport } from '../plan/build-list.ts'
import type { ExtractionPlan, Solution } from '../solver/index.ts'
import { fmtClock, fmtInt, fmtRate, itemName } from './format.ts'
import { ItemIcon, ItemNameLink } from './ItemIcon.tsx'
import { usePlanner } from '../store/planner.ts'
import { T } from './text.ts'

/** 行の中に置くアイコン(px)。表と同じ大きさに揃える。 */
const ROW_ICON = 20
const FLOW_ICON = 16

type Props = {
  solution: Solution
  extraction: ExtractionPlan | null
}

export function BuildListView({ solution, extraction }: Props) {
  const { locale } = useLocale()
  const beltId = usePlanner((s) => s.beltId)
  const pipeId = usePlanner((s) => s.pipeId)
  const list = useMemo(() => deriveBuildList(solution, extraction, { beltId, pipeId }), [solution, extraction, beltId, pipeId])

  if (list.sections.length === 0) {
    return <p className="hint">{T.buildList.empty}</p>
  }

  return (
    <div className="stack build-list">
      <p className="build-total num">{T.buildList.total(fmtInt(list.totalCount))}</p>

      <p className="hint">{buildingCapacityText(locale).intro}</p>
      <p className="hint">{T.buildList.transportNote}</p>

      {list.sections.map((section) => (
        <section className="card card--wide" key={section.id}>
          <h3 className="card__title">
            {T.buildList.sections[section.id]}
            <span className="card__meta num">
              {T.buildList.sectionTotal(fmtInt(section.totalCount))}
            </span>
          </h3>
          <ul className="build-items">
            {section.items.map((item) => (
              <BuildRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function BuildRow({ item }: { item: BuildListItem }) {
  return (
    <li className="build-item">
      <div className="build-item__head">
        <span className="cell-name">
          <ItemIcon id={item.buildingId} name={itemName(item.buildingId)} size={ROW_ICON} />
          <span className="build-item__name">{itemName(item.buildingId)} ({T.buildList.clock(fmtClock(item.clockSpeed).replace(/[.,]0(?=\s?%)/, ''))})</span>
        </span>
        <span className="build-item__count num">{T.buildList.count(fmtInt(item.builtCount))}</span>
      </div>



      {(item.inputs.length > 0 || item.outputs.length > 0) && (
        <div className="build-item__flows">
          {item.inputs.length > 0 && <FlowList heading={T.buildList.inputs} flows={item.inputs} />}
          {item.outputs.length > 0 && (
            <FlowList heading={T.buildList.outputs} flows={item.outputs} output />
          )}
        </div>
      )}
    </li>
  )
}

function FlowList({ heading, flows, output = false }: { heading: string; flows: readonly BuildTransport[]; output?: boolean }) {
  const { locale } = useLocale()
  const P = buildingCapacityText(locale)
  return (
    <section className="build-flows">
      <h4 className="build-flows__title">{heading} ({P.minute})</h4>
      <div className="table-scroll"><table className="build-flows__table">
        <thead><tr><th>{P.resource}</th><th>{P.required}</th><th>{output ? P.capacity : P.consumption}</th><th>{P.transport}</th></tr></thead>
        <tbody>
        {flows.map((flow) => (
          <tr key={flow.item}><td>
            <span className="flow__name">
              <ItemIcon id={flow.item} name={itemName(flow.item)} size={FLOW_ICON} />
              <ItemNameLink id={flow.item}>{itemName(flow.item)}</ItemNameLink>
            </span>
            </td><td className="num">{fmtRate(flow.ratePerMin)}</td>
            <td className="num">{fmtRate(flow.maximumRatePerMin ?? flow.ratePerMin)}</td>
            <td className="build-flows__transport">{transportLabel(flow)}</td>
          </tr>
        ))}
        </tbody></table></div>
    </section>
  )
}

/** 「コンベア・ベルト Mk.5」／1本で運べないときは「Mk.6 ×2本」。 */
function transportLabel(flow: BuildTransport): string {
  const name = itemName(flow.tierId)
  return flow.lines > 1 ? T.buildList.transportLines(name, fmtInt(flow.lines)) : name
}
