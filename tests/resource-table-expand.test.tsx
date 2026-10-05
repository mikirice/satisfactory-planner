// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import { LocaleProvider } from '../src/i18n/index.ts'
import { ResourcesTable } from '../src/ui/ResourcesTable.tsx'
import { planExtraction } from '../src/solver/extraction.ts'
import type { Solution } from '../src/solver/index.ts'
import { usePlanner, cancelPendingSolve } from '../src/store/planner.ts'

it.each([1, 1.5])('resource table preserves numeric columns and name-only links at clock %s', async clock => {
  const original = usePlanner.getState()
  usePlanner.setState({ extractionOverrides: {} })
  const solution = { rawResources: [{ item: 'Desc_OreIron_C', ratePerMin: 500, limitPerMin: null, usageRatio: null }] } as Solution
  const extraction = planExtraction(solution, { clock })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<LocaleProvider initialLocale="en"><ResourcesTable solution={solution} extraction={extraction} /></LocaleProvider>))
    expect(container.querySelector('.resource-row__toggle')).toBeNull()
    expect(container.querySelector('[data-resource]')).toBeNull()
    expect(container.querySelector('.resource-settings-row')).toBeNull()
    expect(container.querySelector('tbody')!.textContent).toContain('500.00')
    expect(container.querySelector('tbody a')?.textContent).toBe('Iron Ore')
    expect(container.querySelector('th[scope="row"] .unit')).toBeNull()
  } finally {
    await act(async () => root.unmount())
    cancelPendingSolve()
    usePlanner.setState(original)
    container.remove()
  }
})
