import { useId } from 'react'
import type { ReactNode } from 'react'

import { useNarrowViewport } from './responsive.ts'
import { usePanelOpen } from '../store/sidebar-panels.ts'
import type { SidebarPanelId } from '../store/sidebar-panels.ts'
import { T } from './text.ts'

type CollapsiblePanelProps = {
  panelId: SidebarPanelId
  title: string
  children: ReactNode
}

/** desktop では開き、狭幅では閉じるサイドバー用パネル。 */
export function CollapsiblePanel({ panelId, title, children }: CollapsiblePanelProps) {
  const narrow = useNarrowViewport()
  const [open, setOpen] = usePanelOpen(panelId, !narrow)
  const bodyId = useId()

  return (
    <section className="panel" data-panel-id={panelId}>
      <button
        type="button"
        className="panel__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className="panel__title">{title}</span>
        <span className="panel__caret">{open ? T.sidebar.close : T.sidebar.open}</span>
      </button>

      {open && (
        <div className="panel__body" id={bodyId}>
          {children}
        </div>
      )}
    </section>
  )
}
