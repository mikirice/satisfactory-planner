// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { LocaleProvider } from '../src/i18n/index.ts'
import { ResourceSettingsPage } from '../src/ui/ResourceSettingsPage.tsx'
import { usePlanner, cancelPendingSolve } from '../src/store/planner.ts'

it('edits a draft, blocks insufficient save and asks before discarding; reset saves automatic mode', async () => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
  const original = usePlanner.getState()
  usePlanner.setState({ extractionOverrides: {}, minerId: 'Build_MinerMk3_C', extractionPurity: 'normal', extractionClock: 1 })
  const host = document.createElement('div'); document.body.append(host)
  const root = createRoot(host); const close = vi.fn()
  const node = { id: 'iron', kind: 'source' as const, item: 'Desc_OreIron_C', itemName: 'Iron Ore', ratePerMin: 500, external: false }
  try {
    await act(async () => root.render(<LocaleProvider initialLocale="en"><ResourceSettingsPage node={node} onClose={close} /></LocaleProvider>))
    const button = (text: string) => [...host.querySelectorAll('button')].find(b => b.textContent === text)!
    expect(host.querySelectorAll('.resource-node-group')).toHaveLength(3)
    expect([...host.querySelectorAll('.resource-setting__stats .num')].map(el => el.textContent)).toEqual(['240.00 / 240.00', '240.00 / 240.00', '20.00 / 240.00'])
    await act(async () => button('Remove').click())
    expect(usePlanner.getState().extractionOverrides).toEqual({})
    expect(host.textContent).toContain('Insufficient supply 20.00')
    expect(button('Save settings').disabled).toBe(true)
    await act(async () => button('Back to graph').click())
    expect(host.querySelector('[role="alertdialog"]')).not.toBeNull()
    expect(close).not.toHaveBeenCalled()
    await act(async () => button('Keep editing').click())
    await act(async () => button('Restore defaults').click())
    expect(host.querySelectorAll('.resource-node-group')).toHaveLength(3)
    await act(async () => button('Save settings').click())
    expect(usePlanner.getState().extractionOverrides).toEqual({})
    expect(close).toHaveBeenCalledOnce()
  } finally {
    await act(async () => root.unmount()); cancelPendingSolve(); usePlanner.setState(original); host.remove()
  }
})
