/** 結果表示（タブ切り替え）。 */
import { Suspense, lazy, useMemo, useState } from 'react'

import { planProgressHash } from '../plan/build-progress.ts'
import { currentSnapshot } from '../plan/persist.ts'
import { SAMPLE_PLANS } from '../plan/samples.ts'
import type { PlanSnapshot } from '../plan/serialize.ts'
import { usePlanner } from '../store/planner.ts'
import { AdSlot } from './AdSlot.tsx'
import { BalanceTable } from './BalanceTable.tsx'
import { BuildListView } from './BuildListView.tsx'
import { InfeasiblePanel } from './InfeasiblePanel.tsx'
import { LoopGuidePanel } from './LoopGuidePanel.tsx'
import { ResourcesTable } from './ResourcesTable.tsx'
import { SamplesPanel } from './SamplesPanel.tsx'
import { StepsTable } from './StepsTable.tsx'
import { SummaryPanel } from './SummaryPanel.tsx'
import { T } from './text.ts'

// React Flow + elkjs は重いので、フローチャートを開いたときだけ読み込む
const FlowChart = lazy(() => import('./FlowChart.tsx'))

type TabId = 'summary' | 'steps' | 'resources' | 'balance' | 'flow' | 'build'

const TABS: readonly TabId[] = ['summary', 'steps', 'resources', 'balance', 'flow', 'build']

type ResultViewProps = {
  viewMode?: 'normal' | 'loop'
}

export function ResultView({ viewMode = 'normal' }: ResultViewProps) {
  const status = usePlanner((s) => s.status)
  const result = usePlanner((s) => s.result)
  const extraction = usePlanner((s) => s.extraction)
  const beltId = usePlanner((s) => s.beltId)
  const pipeId = usePlanner((s) => s.pipeId)
  const loadedTemplateId = usePlanner((s) => s.loadedTemplateId)
  const [tab, setTab] = useState<TabId>('summary')
  // 「発電を隠す」は生産ステップ表とフローチャートで共有する（表示だけ・保存しない）
  const [hidePower, setHidePower] = useState(false)
  /**
   * 建設進捗の保存キー。入力（＝共有URLと同じスナップショット）から決まるので、
   * 同じ計画を開き直せば進捗が戻り、計画を変えればまっさらになる。
   * プラン名やベルトの表示等級だけを変えたときはキーが変わらない（build-progress.ts）。
   *
   * store は解の更新でも通知が来るので、監視は軽い JSON 文字列で行い、
   * そこからハッシュを作り直す（persist.ts の自動保存と同じ作り）。
   */
  const planJson = usePlanner((state) => JSON.stringify(currentSnapshot(state)))
  const buildPlanHash = useMemo(
    () => planProgressHash(JSON.parse(planJson) as PlanSnapshot),
    [planJson],
  )

  if (status === 'error') {
    return (
      <section className="card card--wide">
        <h3 className="card__title">{T.error.heading}</h3>
        <p className="reason__message">{T.error.message}</p>
      </section>
    )
  }

  if (!result) {
    // 空状態。まだ何も触っていない人にはサンプル（SamplesPanel 側で判定）を出す
    return (
      <div className="stack">
        <p className="hint">{T.status.idle}</p>
        <SamplesPanel />
      </div>
    )
  }

  if (result.status === 'infeasible') {
    return <InfeasiblePanel result={result} />
  }

  const loadedTemplate =
    viewMode === 'loop'
      ? SAMPLE_PLANS.find(
          (sample) =>
            sample.id === loadedTemplateId && sample.category === 'special' && sample.guide !== undefined,
        )
      : undefined

  return (
    <>
      {loadedTemplate !== undefined && (
        <LoopGuidePanel key={loadedTemplate.id} sample={loadedTemplate} solution={result} />
      )}
      {/*
        テンプレートを読み込んだ直後だけ出す「そのまま建てに行く」導線（計画書 §8 Phase 2）。
        入力を1つでも触ると loadedTemplateId は null に戻るので、案内は最初の一歩にだけ出る。
      */}
      {loadedTemplateId !== null && tab !== 'build' && (
        <div className="build-cta">
          <button type="button" className="button build-cta__button" onClick={() => setTab('build')}>
            {T.buildList.openFromTemplate}
          </button>
          <span className="hint">{T.buildList.openFromTemplateHint}</span>
        </div>
      )}
      <div className="tabs" role="tablist">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`tabpanel-${id}`}
            className={tab === id ? 'tab tab--on' : 'tab'}
            onClick={() => setTab(id)}
          >
            {T.tabs[id]}
          </button>
        ))}
      </div>

      <div
        className="tabpanel"
        role="tabpanel"
        key={tab}
        id={`tabpanel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === 'summary' && <SummaryPanel solution={result} extraction={extraction} />}
        {tab === 'steps' && (
          <StepsTable
            solution={result}
            hidePower={hidePower}
            onHidePowerChange={setHidePower}
          />
        )}
        {tab === 'resources' && <ResourcesTable solution={result} extraction={extraction} />}
        {tab === 'balance' && <BalanceTable solution={result} />}
        {tab === 'build' && (
          <BuildListView solution={result} extraction={extraction} planHash={buildPlanHash} />
        )}
        {tab === 'flow' && (
          <Suspense fallback={<p className="hint">{T.flow.loading}</p>}>
            <FlowChart
              solution={result}
              beltId={beltId}
              pipeId={pipeId}
              hidePower={hidePower}
              onHidePowerChange={setHidePower}
            />
          </Suspense>
        )}
      </div>

      <AdSlot slot="banner" />
    </>
  )
}
