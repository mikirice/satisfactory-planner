/**
 * 画面スリープ抑止（Screen Wake Lock API）。計画書「建設チェックリスト」§5 Phase 2。
 *
 * 主用途は「スマホをゲームの隣に置いて、建てながら消し込む」こと。数分ごとにしか触らないので
 * 端末が勝手に暗くなる。そこを利用者の意思で止められるようにする。
 *
 * 方針:
 * ・対応していないブラウザでは**UIごと出さない**（押しても何も起きないトグルを見せない）
 * ・OS 側の都合でロックは黙って外れる（タブを隠す・画面を消す）。戻ってきたら取り直す
 * ・要求が拒否されたら（電池セーバー等）トグルはオフに戻すだけ。落とさない・警告も出さない
 * ・状態はセッション限り（保存しない）。次に開いたときは必ずオフから始まる
 */
import { useCallback, useEffect, useState } from 'react'

/** このブラウザが Screen Wake Lock API を持っているか。 */
export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

export type WakeLockControl = {
  /** API がある環境か（false ならトグルを描画しない） */
  supported: boolean
  /** 利用者が「スリープさせない」を選んでいるか */
  enabled: boolean
  setEnabled: (next: boolean) => void
}

export function useWakeLock(): WakeLockControl {
  // supported は起動時に一度だけ見る（実行中に生えたり消えたりしない）
  const [supported] = useState(isWakeLockSupported)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!supported || !enabled) return

    let cancelled = false
    let sentinel: WakeLockSentinel | null = null

    const acquire = async (): Promise<void> => {
      if (cancelled || sentinel !== null) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release().catch(() => undefined)
          return
        }
        sentinel = lock
        // OS が外したときは持ち手を捨てる（次に表に戻ったら取り直せるように）
        lock.addEventListener?.('release', () => {
          if (sentinel === lock) sentinel = null
        })
      } catch {
        // 拒否（電池セーバー・権限・非セキュアコンテキスト等）。トグルはオフに戻す
        if (!cancelled) setEnabled(false)
      }
    }

    void acquire()

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      const lock = sentinel
      sentinel = null
      // オフにしたとき・タブを離れたとき・画面を閉じたときは必ず返す
      if (lock !== null) void lock.release().catch(() => undefined)
    }
  }, [enabled, supported])

  const set = useCallback((next: boolean): void => {
    setEnabled(next)
  }, [])

  return { supported, enabled, setEnabled: set }
}
