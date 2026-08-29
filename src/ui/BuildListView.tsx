/**
 * 建設リスト（計画書「建設チェックリスト（建設モード）」§2・§4・§5 を読み取り専用に縮めたもの）。
 *
 * 用途は「何を・何台建てるのかを一覧で見る」こと。ブラウザ上で消し込んでも実際の建設は進まない
 * ので、チェック・カウンター・進捗の保存は持たない（2026-08-29 の方針転換）。数字と並びの導出は
 * src/plan/build-list.ts にあり、ここは表示だけを持つ（解には一切触らない）。
 */
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { deriveBuildList } from '../plan/build-list.ts'
import type { BuildListItem, BuildTransport } from '../plan/build-list.ts'
import type { ExtractionPlan, Solution } from '../solver/index.ts'
import { fmtClock, fmtCount, fmtInt, fmtPower, fmtRate, isAlternateRecipe, itemName } from './format.ts'
import { AlternateIcon, ItemIcon, ItemNameLink } from './ItemIcon.tsx'
import { T } from './text.ts'

/** 行の中に置くアイコン(px)。表と同じ大きさに揃える。 */
const ROW_ICON = 20
const FLOW_ICON = 16

type Props = {
  solution: Solution
  extraction: ExtractionPlan | null
}

export function BuildListView({ solution, extraction }: Props) {
  const list = useMemo(() => deriveBuildList(solution, extraction), [solution, extraction])

  if (list.sections.length === 0) {
    return <p className="hint">{T.buildList.empty}</p>
  }

  return (
    <div className="stack build-list">
      <p className="build-total num">{T.buildList.total(fmtInt(list.totalCount))}</p>

      <p className="hint">{T.buildList.intro}</p>
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
          <span className="build-item__name">{itemName(item.buildingId)}</span>
        </span>
        <span className="build-item__count num">{T.buildList.count(fmtInt(item.builtCount))}</span>
      </div>

      <p className="build-item__meta">{metaChips(item)}</p>

      {(item.inputs.length > 0 || item.outputs.length > 0) && (
        <div className="build-item__flows">
          {item.inputs.length > 0 && <FlowList heading={T.buildList.inputs} flows={item.inputs} />}
          {item.outputs.length > 0 && (
            <FlowList heading={T.buildList.outputs} flows={item.outputs} />
          )}
        </div>
      )}
    </li>
  )
}

/** 1行にまとめる補助情報（レシピ / 燃料 / 純度 / クロック / シャード / 発電量）。 */
function metaChips(item: BuildListItem) {
  const chips: { key: string; node: ReactNode }[] = []

  if (item.section === 'manufacturing' && item.recipeId !== undefined) {
    chips.push({
      key: 'recipe',
      node: (
        <span className="cell-name">
          {isAlternateRecipe(item.recipeId) && <AlternateIcon size={FLOW_ICON} />}
          <span>{itemName(item.recipeId)}</span>
        </span>
      ),
    })
  }
  if (item.resourceItem !== undefined) {
    chips.push({
      key: 'resource',
      node: (
        <span className="cell-name">
          <ItemIcon
            id={item.resourceItem}
            name={itemName(item.resourceItem)}
            size={FLOW_ICON}
          />
          <span>{itemName(item.resourceItem)}</span>
        </span>
      ),
    })
  }
  for (const node of item.nodes ?? []) {
    if (node.nodes <= 0) continue
    chips.push({
      key: `node-${node.purity}`,
      node: <>{T.buildList.nodes(T.resources.purity[node.purity], fmtCount(node.nodes))}</>,
    })
  }
  if (item.fuelItem !== undefined) {
    chips.push({
      key: 'fuel',
      node: <>{T.buildList.fuel(itemName(item.fuelItem))}</>,
    })
  }
  chips.push({ key: 'clock', node: <>{T.buildList.clock(fmtClock(item.clockSpeed))}</> })
  if (item.powerShards > 0) {
    chips.push({ key: 'shards', node: <>{T.buildList.shards(fmtInt(item.powerShards))}</> })
  }
  if (item.somersloops > 0) {
    chips.push({
      key: 'somersloops',
      node: <>{T.buildList.somersloops(fmtInt(item.somersloops))}</>,
    })
  }
  if ((item.powerProductionMW ?? 0) > 0) {
    chips.push({
      key: 'power',
      node: <>{T.buildList.powerProduction(fmtPower(item.powerProductionMW ?? 0))}</>,
    })
  }

  return chips.map((chip, index) => (
    <span key={chip.key} className="build-item__chip">
      {index > 0 && <span className="build-item__separator">{T.buildList.metaSeparator}</span>}
      {chip.node}
    </span>
  ))
}

function FlowList({ heading, flows }: { heading: string; flows: readonly BuildTransport[] }) {
  return (
    <section className="build-flows">
      <h4 className="build-flows__title">{heading}</h4>
      <ul className="flow-list">
        {flows.map((flow) => (
          <li key={flow.item}>
            <span className="flow__name">
              <ItemIcon id={flow.item} name={itemName(flow.item)} size={FLOW_ICON} />
              <ItemNameLink id={flow.item}>{itemName(flow.item)}</ItemNameLink>
            </span>
            <span className="flow__rate num">{fmtRate(flow.ratePerMin)}</span>
            <span className="build-flows__transport">{transportLabel(flow)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** 「コンベア・ベルト Mk.5」／1本で運べないときは「Mk.6 ×2本」。 */
function transportLabel(flow: BuildTransport): string {
  const name = itemName(flow.tierId)
  return flow.lines > 1 ? T.buildList.transportLines(name, fmtInt(flow.lines)) : name
}
