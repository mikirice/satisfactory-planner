import { useCallback, useSyncExternalStore } from 'react'

/** App.css の narrow viewport breakpoint と同じ条件。 */
export const NARROW_VIEWPORT_QUERY = '(max-width: 879px)'

/** ユーザーが動きを減らす設定にしているかを確認するときの条件。 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function matches(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  )
}

/** media query の変化を React の外部ストアとして購読する。 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void): (() => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => undefined
      }

      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    [query],
  )
  const getSnapshot = useCallback(() => matches(query), [query])

  // SSR と matchMedia の無いテスト環境は desktop 扱いにして、従来どおり内容を表示する。
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function useNarrowViewport(): boolean {
  return useMediaQuery(NARROW_VIEWPORT_QUERY)
}

export function prefersReducedMotion(): boolean {
  return matches(REDUCED_MOTION_QUERY)
}
