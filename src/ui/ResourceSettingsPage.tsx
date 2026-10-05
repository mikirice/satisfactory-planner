import { useEffect, useRef, useState } from 'react'
import { planExtraction } from '../solver/extraction.ts'
import type { CustomExtractionNode } from '../solver/extraction.ts'
import type { SourceGraphNode } from '../plan/graph.ts'
import { nodesFromExtraction, singleMachineNodes } from '../plan/extraction-nodes.ts'
import { extractionDisplay } from '../plan/extraction-display.ts'
import { usePlanner } from '../store/planner.ts'
import { useLocale } from '../i18n/index.ts'
import { resourceExtractionText } from '../i18n/resource-extraction.ts'
import { ResourceExtractionEditor } from './ResourceExtractionEditor.tsx'
import { ItemIcon } from './ItemIcon.tsx'
import { fmtRate, itemName } from './format.ts'

export function ResourceSettingsPage({ node, onClose }: { node: SourceGraphNode; onClose: () => void }) {
  const { locale } = useLocale()
  const P = resourceExtractionText(locale)
  const state = usePlanner()
  const dialog = useRef<HTMLDialogElement>(null)
  const initial = state.extractionOverrides[node.item]
  const [draft, setDraft] = useState<CustomExtractionNode[] | undefined>(() => initial?.nodes !== undefined
    ? singleMachineNodes(initial.nodes) : initial ? nodesFromExtraction(state.extraction!.resources.find(r => r.item === node.item)!) : undefined)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const options = { minerId: state.minerId, purity: state.extractionPurity, clock: state.extractionClock,
    beltId: state.beltId, pipeId: state.pipeId, overrides: draft === undefined ? {} : { [node.item]: { nodes: draft } } }
  const plan = planExtraction({ rawResources: [{ item: node.item, ratePerMin: node.ratePerMin, limitPerMin: null, usageRatio: null }] }, options).resources[0]!
  const display = extractionDisplay(plan)
  const close = () => display.shortfall > 1e-7 ? setConfirmLeave(true) : onClose()
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  return <dialog ref={dialog} className="recipe-picker resource-settings-page" aria-labelledby="resource-settings-title"
    onCancel={event => { event.preventDefault(); close() }}>
    <header className="recipe-picker__header"><h2 id="resource-settings-title"><ItemIcon id={node.item} size={32} />{itemName(node.item)}</h2>
      <div className="resource-settings-actions">
        <button className="button" onClick={close}>{P.back}</button>
        <button className="button" disabled={display.shortfall > 1e-7} onClick={() => {
          state.setResourceExtraction(node.item, draft === undefined ? undefined : { nodes: draft }); onClose()
        }}>{P.save}</button>
      </div></header>
    <div className="recipe-picker__body">
      <p className="resource-settings-summary">{P.required} {fmtRate(node.ratePerMin)}　/　{P.capacity} {fmtRate(display.maximum)}
        <span>{draft === undefined ? P.global : P.configured}</span></p>
      <ExtractionWarning shortfall={display.shortfall} idle={display.idle} />
      <ResourceExtractionEditor item={node.item} required={node.ratePerMin} draftNodes={draft} onChange={setDraft} />
      {confirmLeave && <div className="callout extraction-warning--danger" role="alertdialog" aria-label={P.leaveQuestion}>
        <p>{P.leaveQuestion}</p><button className="button" onClick={() => setConfirmLeave(false)}>{P.keepEditing}</button>{' '}
        <button className="button" onClick={onClose}>{P.discard}</button></div>}
    </div>
  </dialog>
}

export function ExtractionWarning({ shortfall, idle }: { shortfall: number; idle: number }) {
  const { locale } = useLocale()
  const P = resourceExtractionText(locale)
  return shortfall > 1e-7 ? <p className="extraction-warning extraction-warning--danger" role="alert">{P.shortfall} {fmtRate(shortfall)}</p>
    : idle > 0 ? <p className="extraction-warning extraction-warning--idle" role="status">{P.idleWarning(idle)}</p> : null
}
