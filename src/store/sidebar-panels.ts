import { create } from 'zustand'

export const SIDEBAR_STORAGE_KEY = 'satisfactory-planner.sidebar-panels.v1'
export const SIDEBAR_PANEL_IDS = ['targets', 'inputs', 'objective', 'power', 'clock', 'extraction', 'raw-resources', 'alternates', 'limits', 'logistics', 'plans', 'export'] as const
export type SidebarPanelId = typeof SIDEBAR_PANEL_IDS[number]
type PanelStates = Partial<Record<SidebarPanelId, boolean>>

export function readSidebarPanels(): PanelStates {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(SIDEBAR_PANEL_IDS.flatMap(id => {
      const open = (value as Record<string, unknown>)[id]
      return typeof open === 'boolean' ? [[id, open]] : []
    }))
  } catch { return {} }
}
function save(panels: PanelStates) {
  try { localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(panels)) } catch { /* Storage may be unavailable. */ }
}
export const useSidebarPanels = create<{
  panels: PanelStates
  setOpen: (id: SidebarPanelId, open: boolean) => void
  setAll: (open: boolean) => void
}>((set, get) => ({
  panels: readSidebarPanels(),
  setOpen: (id, open) => {
    const panels = { ...get().panels, [id]: open }
    save(panels)
    set({ panels })
  },
  setAll: open => {
    const panels = Object.fromEntries(SIDEBAR_PANEL_IDS.map(id => [id, open]))
    save(panels)
    set({ panels })
  },
}))
export function usePanelOpen(id: SidebarPanelId, defaultOpen: boolean): [boolean, (open: boolean) => void] {
  const open = useSidebarPanels(state => state.panels[id] ?? defaultOpen)
  const setOpen = useSidebarPanels(state => state.setOpen)
  return [open, value => setOpen(id, value)]
}
