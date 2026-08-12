import { useEffect, useState } from 'react'

import { meta } from './data/index.ts'
import { disposeGlpk } from './solver/index.ts'
import { usePlanner } from './store/planner.ts'
import { ResultView } from './ui/ResultView.tsx'
import { SamplesPanel } from './ui/SamplesPanel.tsx'
import { Sidebar } from './ui/Sidebar.tsx'
import { SiteFooter } from './ui/SiteFooter.tsx'
import { T } from './ui/text.ts'
import './App.css'

function App() {
  const [viewMode, setViewMode] = useState<'normal' | 'loop'>('normal')
  const status = usePlanner((s) => s.status)
  const result = usePlanner((s) => s.result)
  const elapsedMs = usePlanner((s) => s.elapsedMs)

  // ブラウザ版 glpk.js は Web Worker で動くので、アンマウント時に止める
  useEffect(() => () => void disposeGlpk(), [])

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">{T.appTitle}</h1>
        <p className="header__status">
          <span className={`tag ${statusClass(status, result?.status)}`}>
            {statusLabel(status, result?.status)}
          </span>
          {status === 'done' && <span className="header__elapsed">{T.status.elapsed(elapsedMs)}</span>}
        </p>
        <div className="header__mode" role="group" aria-label={T.viewMode.label}>
          <button
            type="button"
            className="header__mode-button"
            aria-pressed={viewMode === 'normal'}
            onClick={() => setViewMode('normal')}
          >
            {T.viewMode.normal}
          </button>
          <button
            type="button"
            className="header__mode-button"
            aria-pressed={viewMode === 'loop'}
            onClick={() => setViewMode('loop')}
          >
            {T.viewMode.loop}
          </button>
        </div>
        <p className="header__meta">
          {T.dataVersion} {meta.gameVersion}
        </p>
      </header>

      <div className="layout">
        {viewMode === 'normal' ? (
          <Sidebar />
        ) : (
          <aside className="sidebar sidebar--loop">
            <SamplesPanel variant="loop" />
          </aside>
        )}
        <main className="main">
          <ResultView />
        </main>
      </div>

      <SiteFooter />
    </div>
  )
}

function statusLabel(status: string, resultStatus: string | undefined): string {
  if (status === 'solving') return T.status.solving
  if (status === 'error') return T.status.error
  if (status === 'done') return resultStatus === 'optimal' ? T.status.done : T.status.infeasible
  return T.status.idle
}

function statusClass(status: string, resultStatus: string | undefined): string {
  if (status === 'error') return 'is-shortage'
  if (status === 'done') return resultStatus === 'optimal' ? 'is-surplus' : 'is-shortage'
  return 'is-balanced'
}

export default App
