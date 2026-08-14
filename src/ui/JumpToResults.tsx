import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

import { prefersReducedMotion, useNarrowViewport } from './responsive.ts'
import { T } from './text.ts'

type JumpToResultsProps = {
  targetRef: RefObject<HTMLElement | null>
  available: boolean
  statusLabel: string
  statusClassName: string
}

/** 狭幅で結果が画面外にあるときだけ表示するショートカット。 */
export function JumpToResults({
  targetRef,
  available,
  statusLabel,
  statusClassName,
}: JumpToResultsProps) {
  const narrow = useNarrowViewport()
  const [resultsBelow, setResultsBelow] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    if (
      !available ||
      !narrow ||
      target === null ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setResultsBelow(false)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry === undefined) {
        setResultsBelow(false)
        return
      }
      const viewportBottom = entry.rootBounds?.bottom ?? window.innerHeight
      setResultsBelow(!entry.isIntersecting && entry.boundingClientRect.top >= viewportBottom)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [available, narrow, targetRef])

  if (!available || !narrow || !resultsBelow) return null

  return (
    <button
      type="button"
      className="jump-to-results"
      aria-label={`${T.jumpToResults.label}（${statusLabel}）`}
      onClick={() =>
        targetRef.current?.scrollIntoView({
          behavior: prefersReducedMotion() ? 'instant' : 'smooth',
          block: 'start',
        })
      }
    >
      <span>{T.jumpToResults.label}</span>
      <span className={`tag ${statusClassName}`}>{statusLabel}</span>
    </button>
  )
}
