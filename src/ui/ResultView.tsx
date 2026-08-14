/** 結果表示（タブ切り替え）。 */
import { Suspense, lazy, useState } from 'react'

import { SAMPLE_PLANS } from '../plan/samples.ts'
import { usePlanner } from '../store/planner.ts'
import { AdSlot } from './AdSlot.tsx'
import { BalanceTable } from './BalanceTable.tsx'
import { InfeasiblePanel } from './InfeasiblePanel.tsx'
import { LoopGuidePanel } from './LoopGuidePanel.tsx'
import { ResourcesTable } from './ResourcesTable.tsx'
import { SamplesPanel } from './SamplesPanel.tsx'
import { StepsTable } from './StepsTable.tsx'
import { SummaryPanel } from './SummaryPanel.tsx'
import { T } from './text.ts'

// React Flow + elkjs は重いので、フローチャートを開いたときだけ読み込む
const FlowChart = lazy(() => import('./FlowChart.tsx'))

type TabId = 'summary' | 'steps' | 'resources' | 'balance' | 'flow'

const TABS: readonly TabId[] = ['summary', 'steps', 'resources', 'balance', 'flow']

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
