import { useId, useState } from 'react'
import type { ReactNode } from 'react'

import { useNarrowViewport } from './responsive.ts'
import { T } from './text.ts'

type CollapsiblePanelProps = {
  title: string
  children: ReactNode
}

/** desktop では開き、狭幅では閉じるサイドバー用パネル。 */
export function CollapsiblePanel({ title, children }: CollapsiblePanelProps) {
  const narrow = useNarrowViewport()
  const [openOverride, setOpenOverride] = useState<boolean | null>(null)
  const bodyId = useId()
  const open = openOverride ?? !narrow

  return (
    <section className="panel">
      <button
        type="button"
        className="panel__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpenOverride(!open)}
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
