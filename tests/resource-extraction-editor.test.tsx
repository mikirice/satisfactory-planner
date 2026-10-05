// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import { LocaleProvider } from '../src/i18n/index.ts'
import { ResourceExtractionEditor } from '../src/ui/ResourceExtractionEditor.tsx'
import { usePlanner, cancelPendingSolve } from '../src/store/planner.ts'
import { planExtraction } from '../src/solver/extraction.ts'

it('uses only single-machine rows; add/remove and restore use current sidebar defaults', async () => {
  const iron = 'Desc_OreIron_C'
  const node = { extractorId: 'Build_MinerMk3_C', purity: 'normal' as const, clock: 1, count: 1 }
  const original = usePlanner.getState()
  usePlanner.setState({ extractionOverrides: { [iron]: { nodes: [node, node] } }, minerId: node.extractorId, extractionPurity: 'normal', extractionClock: 1 })
  const plan = planExtraction({ rawResources: [{ item: iron, ratePerMin: 300, limitPerMin: null, usageRatio: null }] }).resources[0]
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<LocaleProvider initialLocale="en"><ResourceExtractionEditor item={iron} required={300} plan={plan} /></LocaleProvider>))
    expect(container.querySelectorAll('.resource-node-group')).toHaveLength(2)
    expect(container.querySelectorAll('select')).toHaveLength(4)
    expect(container.querySelectorAll('input')).toHaveLength(2)
    const button = (text: string) => [...container.querySelectorAll('button')].find(b => b.textContent === text)!
    await act(async () => button('Add node group').click())
    expect(usePlanner.getState().extractionOverrides[iron].nodes).toHaveLength(3)
    await act(async () => button('Remove').click())
    expect(usePlanner.getState().extractionOverrides[iron].nodes).toHaveLength(2)
    await act(async () => usePlanner.setState({ extractionPurity: 'pure', extractionClock: 1.5 }))
    expect(usePlanner.getState().extractionOverrides[iron].nodes![0].purity).toBe('normal')
    await act(async () => button('Restore defaults').click())
    expect(usePlanner.getState().extractionOverrides[iron]).toBeUndefined()
  } finally {
    await act(async () => root.unmount())
    cancelPendingSolve()
    usePlanner.setState(original)
    container.remove()
  }
})
