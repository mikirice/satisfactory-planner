import { useEffect, useRef, useState } from 'react'

import { meta } from './data/index.ts'
import { useLocale } from './i18n/index.ts'
import type { Locale } from './i18n/index.ts'
import { saveAutosaveNow } from './plan/persist.ts'
import { defaultPlanInput } from './plan/serialize.ts'
import { disposeGlpk } from './solver/index.ts'
import { hasAnyInput, usePlanner } from './store/planner.ts'
import { itemName } from './ui/format.ts'
import { RecipeBrowser } from './ui/RecipeBrowser.tsx'
import type { RecipePlanRequest } from './ui/RecipeBrowser.tsx'
import { JumpToResults } from './ui/JumpToResults.tsx'
import { ResultView } from './ui/ResultView.tsx'
import { SamplesPanel } from './ui/SamplesPanel.tsx'
import { Sidebar } from './ui/Sidebar.tsx'
import { SiteFooter } from './ui/SiteFooter.tsx'
import { T } from './ui/text.ts'
import './App.css'

function App() {
  const { locale, setLocale } = useLocale()
  const [viewMode, setViewMode] = useState<'normal' | 'loop' | 'recipe'>('normal')
  const status = usePlanner((s) => s.status)
  const result = usePlanner((s) => s.result)
  const elapsedMs = usePlanner((s) => s.elapsedMs)
  const applyPlan = usePlanner((s) => s.applyPlan)
  const hasWork = usePlanner(hasAnyInput)
  const resultsRef = useRef<HTMLElement>(null)

  // ブラウザ版 glpk.js は Web Worker で動くので、アンマウント時に止める
  useEffect(() => () => void disposeGlpk(), [])

  const createPlanFromRecipe = async (request: RecipePlanRequest): Promise<void> => {
    if (hasWork && !window.confirm(T.recipeBrowser.confirmReplace(itemName(request.itemId)))) {
      return
    }

    applyPlan({
      ...defaultPlanInput(),
      targets: [{ item: request.itemId, ratePerMin: request.ratePerMin }],
      enabledAlternates:
        request.alternateRecipeId === undefined
          ? {}
          : { [request.alternateRecipeId]: true },
    })
    // 明示操作で作った計画は、通常の800msデバウンスを待たず確実に自動保存へ反映する。
    await saveAutosaveNow()
    setViewMode('normal')
  }

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
          <button
            type="button"
            className="header__mode-button"
            aria-pressed={viewMode === 'recipe'}
            onClick={() => setViewMode('recipe')}
          >
            {T.viewMode.recipe}
          </button>
        </div>
        <select
          className="header__language"
          aria-label={T.language.label}
          title={T.language.label}
          value={locale}
          onChange={(event) => setLocale(event.currentTarget.value as Locale)}
        >
          <option value="ja">{T.language.japanese}</option>
          <option value="en">{T.language.english}</option>
        </select>
        <p className="header__meta">
          {T.dataVersion} {meta.gameVersion}
        </p>
      </header>

      {viewMode === 'recipe' && (
        <RecipeBrowser onCreatePlan={(request) => void createPlanFromRecipe(request)} />
      )}
      {/*
       * PlansPanel が持つ復元・自動保存の購読をモード切替で切らないため、通常レイアウトは
       * 非表示でもマウントしたままにする。レシピ閲覧だけでプランが古い保存内容へ戻るのを防ぐ。
      */}
      <div className="layout" hidden={viewMode === 'recipe'}>
        {viewMode === 'loop' && (
          <aside className="sidebar sidebar--loop">
            <SamplesPanel variant="loop" />
          </aside>
        )}
        <Sidebar hidden={viewMode !== 'normal'} />
        <main className="main" ref={resultsRef}>
          <ResultView viewMode={viewMode === 'loop' ? 'loop' : 'normal'} />
        </main>
      </div>

      <JumpToResults
        targetRef={resultsRef}
        available={viewMode !== 'recipe' && result !== null}
        statusLabel={statusLabel(status, result?.status)}
        statusClassName={statusClass(status, result?.status)}
      />

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
