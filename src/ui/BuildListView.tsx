/**
 * 建設チェックリスト（計画書「建設チェックリスト（建設モード）」§2・§4・§5）。
 *
 * 主用途は「スマホをゲームの隣に置いて、建てながら消し込む」こと。だから
 * タップ領域を大きく取り、全体の進捗は上に貼り付ける。数字と並びの導出は
 * src/plan/build-list.ts、保存は src/plan/build-progress.ts に分けてあり、
 * ここは表示と操作だけを持つ（解には一切触らない）。
 *
 * Phase 2 で足した動き（design-spells 型 D2「チェックインの波紋」）:
 * 完了した瞬間だけチェックから波紋を1回出す。連打しても重ねず最新の1つを描き直すだけで、
 * 外すときは何も出さない。prefers-reduced-motion では波紋そのものを描かない
 * （CSS 側でも animation を止めてある。常時ループする動きはこの画面に置かない）。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { deriveBuildList } from '../plan/build-list.ts'
import type { BuildListItem, BuildTransport } from '../plan/build-list.ts'
import {
  clearBuildProgress,
  loadBuildProgress,
  saveBuildProgress,
} from '../plan/build-progress.ts'
import type { BuildProgress } from '../plan/build-progress.ts'
import type { ExtractionPlan, Solution } from '../solver/index.ts'
import { fmtClock, fmtCount, fmtInt, fmtPower, fmtRate, isAlternateRecipe, itemName } from './format.ts'
import { AlternateIcon, ItemIcon, ItemNameLink } from './ItemIcon.tsx'
import { REDUCED_MOTION_QUERY, useMediaQuery } from './responsive.ts'
import { T } from './text.ts'
import { useWakeLock } from './wake-lock.ts'

/** 行の中に置くアイコン(px)。表と同じ大きさに揃える。 */
const ROW_ICON = 20
const FLOW_ICON = 16

type Props = {
  solution: Solution
  extraction: ExtractionPlan | null
  /**
   * 計画スナップショットの決定的ハッシュ。進捗の保存キーになる
   * （同じ計画を開き直せば続きから／計画を変えればまっさら）。
   */
  planHash: string
}

export function BuildListView({ solution, extraction, planHash }: Props) {
  const list = useMemo(() => deriveBuildList(solution, extraction), [solution, extraction])
  const [progress, setProgress] = useState<BuildProgress>(() => loadBuildProgress(planHash))
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  // 画面スリープ抑止。対応ブラウザでだけトグルを出し、このタブを離れたら必ず解放する
  const wakeLock = useWakeLock()

  // 計画が変わったら（＝キーが変わったら）その計画の進捗を読み直す
  useEffect(() => {
    setProgress(loadBuildProgress(planHash))
  }, [planHash])

  const builtOf = (item: BuildListItem): number =>
    Math.min(item.builtCount, Math.max(0, progress[item.id] ?? 0))

  const setBuilt = (item: BuildListItem, next: number): void => {
    const value = Math.min(item.builtCount, Math.max(0, Math.floor(next)))
    const updated: Record<string, number> = { ...progress }
    if (value <= 0) delete updated[item.id]
    else updated[item.id] = value
    setProgress(updated)
    saveBuildProgress(planHash, updated)
  }

  const reset = (): void => {
    if (!globalThis.confirm(T.buildList.resetConfirm)) return
    setProgress({})
    clearBuildProgress(planHash)
  }

  if (list.sections.length === 0) {
    return <p className="hint">{T.buildList.empty}</p>
  }

  const totalBuilt = list.sections.reduce(
    (sum, section) => sum + section.items.reduce((n, item) => n + builtOf(item), 0),
    0,
  )

  return (
    <div className="stack build-list">
      <div className="build-progress">
        <div className="build-progress__head">
          <span className="build-progress__label">{T.buildList.overall}</span>
          <span className="build-progress__count num">
            {T.buildList.progress(fmtInt(totalBuilt), fmtInt(list.totalCount))}
          </span>
        </div>
        <ProgressBar built={totalBuilt} total={list.totalCount} label={T.buildList.overall} />
        <div className="build-progress__controls">
          <button type="button" className="button button--small build-progress__reset" onClick={reset}>
            {T.buildList.reset}
          </button>
          {wakeLock.supported && (
            <label className="build-wake">
              <input
                type="checkbox"
                checked={wakeLock.enabled}
                onChange={(event) => wakeLock.setEnabled(event.target.checked)}
              />
              <span>{T.buildList.wakeLock}</span>
            </label>
          )}
        </div>
      </div>

      <p className="hint">{T.buildList.intro}</p>
      <p className="hint">{T.buildList.transportNote}</p>
      <p className="hint">{T.buildList.storageNote}</p>

      {list.sections.map((section) => {
        const sectionBuilt = section.items.reduce((n, item) => n + builtOf(item), 0)
        return (
          <section className="card card--wide" key={section.id}>
            <h3 className="card__title">
              {T.buildList.sections[section.id]}
              <span className="card__meta">
                {T.buildList.progress(fmtInt(sectionBuilt), fmtInt(section.totalCount))}
              </span>
            </h3>
            <ProgressBar
              built={sectionBuilt}
              total={section.totalCount}
              label={T.buildList.sections[section.id]}
            />
            <ul className="build-items">
              {section.items.map((item) => (
                <BuildRow
                  key={item.id}
                  item={item}
                  built={builtOf(item)}
                  reducedMotion={reducedMotion}
                  onChange={(next) => setBuilt(item, next)}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function ProgressBar({ built, total, label }: { built: number; total: number; label: string }) {
  const ratio = total <= 0 ? 0 : Math.min(1, built / total)
  return (
    <div
      className="build-bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={built}
    >
      <span className="build-bar__fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}

type RowProps = {
  item: BuildListItem
  built: number
  /** 動きを減らす設定のときは波紋そのものを描かない */
  reducedMotion: boolean
  onChange: (next: number) => void
}

function BuildRow({ item, built, reducedMotion, onChange }: RowProps) {
  const done = built >= item.builtCount
  /**
   * 波紋の世代番号（0 = 出していない）。
   * 完了になった瞬間だけ +1 する。key に使うので、連打しても要素は1つのまま描き直され、
   * 前の波紋が残って重なることがない（型 D2「連打時は最新のみ」）。
   */
  const [ripple, setRipple] = useState(0)
  const wasDone = useRef(done)

  useEffect(() => {
    // 未完了 → 完了のときだけ。外したとき・復元して最初から完了だったときは出さない
    if (done && !wasDone.current) setRipple((generation) => generation + 1)
    // 完了を外したら描きかけの波紋も引っ込める（外す操作に動きは付けない）
    if (!done) setRipple(0)
    wasDone.current = done
  }, [done])

  return (
    <li className={done ? 'build-item build-item--done' : 'build-item'}>
      <div className="build-item__head">
        <label className="build-item__check">
          <span className="build-item__checkbox">
            <input
              type="checkbox"
              checked={done}
              aria-label={T.buildList.markComplete}
              onChange={() => onChange(done ? 0 : item.builtCount)}
            />
            {ripple > 0 && !reducedMotion && (
              <span
                key={ripple}
                className="build-item__ripple"
                aria-hidden="true"
                onAnimationEnd={() => setRipple(0)}
              />
            )}
          </span>
          <span className="cell-name">
            <ItemIcon id={item.buildingId} name={itemName(item.buildingId)} size={ROW_ICON} />
            <span className="build-item__name">{itemName(item.buildingId)}</span>
          </span>
        </label>
        <div className="build-counter">
          <button
            type="button"
            className="build-counter__button"
            aria-label={T.buildList.decrease}
            disabled={built <= 0}
            onClick={() => onChange(built - 1)}
          >
            −
          </button>
          <span className="build-counter__value num">
            {T.buildList.built(fmtInt(built), fmtInt(item.builtCount))}
          </span>
          <button
            type="button"
            className="build-counter__button"
            aria-label={T.buildList.increase}
            disabled={built >= item.builtCount}
            onClick={() => onChange(built + 1)}
          >
            +
          </button>
        </div>
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
