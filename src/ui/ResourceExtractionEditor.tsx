import { itemsById } from '../data/index.ts'
import { useLocale } from '../i18n/index.ts'
import { resourceExtractionText } from '../i18n/resource-extraction.ts'
import { usePlanner } from '../store/planner.ts'
import { resourceExtractorIds, WATER_EXTRACTOR_ID, planExtraction } from '../solver/extraction.ts'
import { nodesFromExtraction, singleMachineNodes } from '../plan/extraction-nodes.ts'
import { extractionDisplay } from '../plan/extraction-display.ts'
import type { CustomExtractionNode, ResourceExtraction } from '../solver/extraction.ts'
import type { ResourcePurity } from '../data/map-limits.ts'
import { itemName, fmtRate } from './format.ts'
import { NumberField } from './NumberField.tsx'

type Props = { item: string; required: number; plan?: ResourceExtraction; draftNodes?: CustomExtractionNode[]; onChange?: (nodes: CustomExtractionNode[] | undefined) => void }
export function ResourceExtractionEditor({ item, required, plan, draftNodes, onChange }: Props) {
  const { locale } = useLocale()
  const P = resourceExtractionText(locale)
  const config = usePlanner(s => s.extractionOverrides[item])
  const setConfig = usePlanner(s => s.setResourceExtraction)
  const globalMiner = usePlanner(s => s.minerId)
  const globalPurity = usePlanner(s => s.extractionPurity)
  const globalClock = usePlanner(s => s.extractionClock)
  const beltId = usePlanner(s => s.beltId)
  const pipeId = usePlanner(s => s.pipeId)
  const solid = itemsById.get(item)?.form === 'solid'
  const defaults = () => nodesFromExtraction(planExtraction({ rawResources: [{ item, ratePerMin: required,
    limitPerMin: null, usageRatio: null }] }, { minerId: globalMiner, purity: globalPurity,
    clock: globalClock, beltId, pipeId }).resources[0]!)
  const nodes = onChange ? draftNodes ?? defaults() : config?.nodes !== undefined ? singleMachineNodes(config.nodes) : plan ? nodesFromExtraction(plan) : defaults()
  const update = (next: CustomExtractionNode[] | undefined) => onChange ? onChange(next) : setConfig(item, next ? { nodes: next } : undefined)
  const preview = planExtraction({ rawResources: [{ item, ratePerMin: required, limitPerMin: null, usageRatio: null }] },
    { minerId: globalMiner, purity: globalPurity, clock: globalClock, beltId, pipeId, overrides: { [item]: { nodes } } }).resources[0]!
  const available = extractionDisplay(preview).rows.slice()
  const rowRates = nodes.map(node => {
    const index = available.findIndex(row => row.extractorId === node.extractorId && row.purity === node.purity && row.clock === node.clock)
    return index >= 0 ? available.splice(index, 1)[0] : { required: 0, maximum: 0 }
  })
  const newNode = (): CustomExtractionNode => ({ extractorId: solid ? globalMiner : resourceExtractorIds(item)[0]!,
    purity: globalPurity, clock: globalClock, count: 1 })
  const patchNode = (index: number, value: Partial<CustomExtractionNode>) => update(nodes.map((n, i) => i === index ? { ...n, ...value, count: 1 } : n))
  const clockField = (clock: number, set: (v: number) => void) => <label className="field">
    <span>{P.clock}</span><NumberField className="input" min={1} max={250} step={1} value={clock * 100}
      onValueChange={v => set(Math.max(.01, Math.min(2.5, v / 100)))} /></label>
  const purityField = (purity: ResourcePurity, set: (v: ResourcePurity) => void, disabled = false) => <label className="field">
    <span>{P.purity}</span><select className="input" value={purity} disabled={disabled}
      onChange={e => set(e.target.value as ResourcePurity)}>
      {(['impure', 'normal', 'pure'] as const).map(p => <option key={p} value={p}>{P.purityNames[p]}</option>)}</select></label>
  return <div className="stack resource-setting__body" data-resource={item}>
        {nodes.map((node, index) => <div className="resource-node-group" key={index}>
          <div className="resource-setting__fields">
            <label className="field"><span>{P.miner}</span><select className="input" value={node.extractorId}
              onChange={e => patchNode(index, { extractorId: e.target.value, ...(e.target.value === WATER_EXTRACTOR_ID ? { purity: 'normal' as const } : {}) })}>
              {resourceExtractorIds(item).map(id => <option key={id} value={id}>{itemName(id)}</option>)}</select></label>
            {purityField(node.purity, purity => patchNode(index, { purity }), node.extractorId === WATER_EXTRACTOR_ID)}
            {clockField(node.clock, clock => patchNode(index, { clock }))}
          </div>
          <div className="resource-setting__stats">
            <span className="num">{fmtRate(rowRates[index].required)} / {fmtRate(rowRates[index].maximum)}</span>{' '}
            <button className="button button--small" onClick={() => update(nodes.filter((_, i) => i !== index))}>{P.remove}</button></div>
        </div>)}
        <button className="button" onClick={() => update([...nodes, newNode()])}>{P.add}</button>
      <button className="button" onClick={() => update(undefined)}>{P.reset}</button>
  </div>
}
