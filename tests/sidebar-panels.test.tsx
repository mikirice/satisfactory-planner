// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { CollapsiblePanel } from '../src/ui/CollapsiblePanel.tsx'
import { readSidebarPanels, SIDEBAR_PANEL_IDS, SIDEBAR_STORAGE_KEY, useSidebarPanels } from '../src/store/sidebar-panels.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => { localStorage.clear(); useSidebarPanels.setState({ panels: {} }) })
describe('sidebar panel preferences', () => {
  it('keeps each choice independent, survives reload, and uses stable IDs', () => {
    useSidebarPanels.getState().setOpen('power', false)
    useSidebarPanels.getState().setOpen('limits', true)
    expect(readSidebarPanels()).toEqual({ power: false, limits: true })
    useSidebarPanels.setState({ panels: readSidebarPanels() })
    expect(useSidebarPanels.getState().panels).toEqual({ power: false, limits: true })
    localStorage.setItem(SIDEBAR_STORAGE_KEY, '{"power":false,"limits":"bad","unknown":true}')
    expect(readSidebarPanels()).toEqual({ power: false })
  })
  it('expands and collapses every panel, including mounted controls', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    await act(async () => root.render(<CollapsiblePanel panelId="power" title="Power"><span>Panel body</span></CollapsiblePanel>))
    await act(async () => useSidebarPanels.getState().setAll(false))
    expect(host.querySelector('button')!.getAttribute('aria-expanded')).toBe('false')
    expect(host.textContent).not.toContain('Panel body')
    expect(readSidebarPanels()).toEqual(Object.fromEntries(SIDEBAR_PANEL_IDS.map(id => [id, false])))
    await act(async () => useSidebarPanels.getState().setAll(true))
    expect(host.querySelector('button')!.getAttribute('aria-expanded')).toBe('true')
    expect(host.textContent).toContain('Panel body')
    expect(readSidebarPanels()).toEqual(Object.fromEntries(SIDEBAR_PANEL_IDS.map(id => [id, true])))
    await act(async () => root.unmount())
    host.remove()
  })
})
