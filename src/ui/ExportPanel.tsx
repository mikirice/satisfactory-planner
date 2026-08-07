/**
 * Excel 出力パネル（プラン名＋ダウンロードボタン）。
 *
 * exceljs はバンドルが重いので、モジュール先頭ではなくクリック時に動的 import する。
 * 解が無い / 実行不能 / 計算中はボタンを無効にして、壊れたファイルを作らせない。
 */
import { useState } from 'react'

import { toExcelInput, usePlanner } from '../store/planner.ts'
import { T } from './text.ts'

export function ExportPanel() {
  const planName = usePlanner((s) => s.planName)
  const setPlanName = usePlanner((s) => s.setPlanName)
  const status = usePlanner((s) => s.status)
  const result = usePlanner((s) => s.result)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = status !== 'solving' && result?.status === 'optimal'

  const download = async (): Promise<void> => {
    const input = toExcelInput(usePlanner.getState())
    if (!input) return
    setBusy(true)
    setError(null)
    try {
      const { downloadPlanWorkbook } = await import('../export/excel.ts')
      await downloadPlanWorkbook(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="panel__title">{T.export.heading}</h2>

      <label className="field">
        <span className="field__label">{T.export.planName}</span>
        <input
          type="text"
          className="input"
          value={planName}
          placeholder={T.export.planNamePlaceholder}
          onChange={(e) => setPlanName(e.target.value)}
        />
      </label>

      <button
        type="button"
        className="button button--primary"
        disabled={!ready || busy}
        onClick={() => void download()}
      >
        {busy ? T.export.downloading : T.export.download}
      </button>

      {!ready && <p className="hint">{T.export.needsSolution}</p>}

      {error !== null && (
        <p className="callout callout--warn">
          {T.export.failed}: {error}
        </p>
      )}
    </section>
  )
}
