import { useEffect } from 'react'

import { meta } from './data/index.ts'
import { disposeGlpk } from './solver/index.ts'
import { usePlanner } from './store/planner.ts'
import { ResultView } from './ui/ResultView.tsx'
import { Sidebar } from './ui/Sidebar.tsx'
import { T } from './ui/text.ts'
import './App.css'

function App() {
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
        <p className="header__meta">
          {T.dataVersion} {meta.gameVersion}
        </p>
      </header>

      <div className="layout">
        <Sidebar />
        <main className="main">
          <ResultView />
        </main>
      </div>
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
