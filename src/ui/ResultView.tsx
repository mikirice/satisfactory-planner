/** 結果表示（タブ切り替え）。 */
import { Suspense, lazy, useState } from 'react'

import { usePlanner } from '../store/planner.ts'
import { BalanceTable } from './BalanceTable.tsx'
import { InfeasiblePanel } from './InfeasiblePanel.tsx'
import { ResourcesTable } from './ResourcesTable.tsx'
import { StepsTable } from './StepsTable.tsx'
import { SummaryPanel } from './SummaryPanel.tsx'
import { T } from './text.ts'

// React Flow + elkjs は重いので、フローチャートを開いたときだけ読み込む
const FlowChart = lazy(() => import('./FlowChart.tsx'))

type TabId = 'summary' | 'steps' | 'resources' | 'balance' | 'flow'

const TABS: { id: TabId; label: string }[] = [
  { id: 'summary', label: T.tabs.summary },
  { id: 'steps', label: T.tabs.steps },
  { id: 'resources', label: T.tabs.resources },
  { id: 'balance', label: T.tabs.balance },
  { id: 'flow', label: T.tabs.flow },
]

export function ResultView() {
  const status = usePlanner((s) => s.status)
  const result = usePlanner((s) => s.result)
  const extraction = usePlanner((s) => s.extraction)
  const error = usePlanner((s) => s.error)
  const beltId = usePlanner((s) => s.beltId)
  const pipeId = usePlanner((s) => s.pipeId)
  const [tab, setTab] = useState<TabId>('summary')

  if (status === 'error') {
    return (
      <section className="card card--wide">
        <h3 className="card__title">{T.error.heading}</h3>
        <p className="reason__message">{error}</p>
      </section>
    )
  }

  if (!result) {
    return <p className="hint">{T.status.idle}</p>
  }

  if (result.status === 'infeasible') {
    return <InfeasiblePanel result={result} />
  }

  return (
    <>
      <div className="tabs" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`tab-${entry.id}`}
            aria-selected={tab === entry.id}
            aria-controls={`tabpanel-${entry.id}`}
            className={tab === entry.id ? 'tab tab--on' : 'tab'}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
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
        {tab === 'steps' && <StepsTable solution={result} />}
        {tab === 'resources' && <ResourcesTable solution={result} extraction={extraction} />}
        {tab === 'balance' && <BalanceTable solution={result} />}
        {tab === 'flow' && (
          <Suspense fallback={<p className="hint">{T.flow.loading}</p>}>
            <FlowChart solution={result} beltId={beltId} pipeId={pipeId} />
          </Suspense>
        )}
      </div>
    </>
  )
}
