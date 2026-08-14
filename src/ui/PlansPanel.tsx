/**
 * プランの保存・読込・共有パネル。
 *
 * 起動時の復元（URLハッシュ > 自動保存）と自動保存の開始もここで行う。
 * 画面に1つしか無いパネルなので、ライフサイクルの置き場所としてちょうどよく、
 * 復元結果のお知らせを出す場所とも一致する。
 */
import { useEffect, useRef, useState } from 'react'

import {
  applyPlanFromHash,
  currentSnapshot,
  restoreInitialPlan,
  saveAutosaveNow,
  startAutosave,
} from '../plan/persist.ts'
import { buildShareUrl, parsePlanSnapshot, stripPlanParam } from '../plan/serialize.ts'
import { planStorage } from '../plan/storage.ts'
import type { SavedPlan } from '../plan/storage.ts'
import { usePlanner } from '../store/planner.ts'
import { CollapsiblePanel } from './CollapsiblePanel.tsx'
import { T } from './text.ts'

/** 一過性のお知らせ（成功フィードバック）を消すまでの時間 */
const NOTICE_MS = 2500

type Notice = { kind: 'info' | 'warn'; text: string }

export function PlansPanel() {
  const planName = usePlanner((s) => s.planName)
  const setPlanName = usePlanner((s) => s.setPlanName)
  const applyPlan = usePlanner((s) => s.applyPlan)

  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [notice, setNotice] = useState<Notice | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const alive = useRef(true)

  /** 一定時間で消えるお知らせ（ループはしない） */
  const flash = (kind: Notice['kind'], text: string): void => {
    if (!alive.current) return
    setNotice({ kind, text })
    if (noticeTimer.current !== undefined) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => {
      if (alive.current) setNotice(null)
    }, NOTICE_MS)
  }

  const reload = async (): Promise<void> => {
    try {
      const list = await planStorage().list()
      if (alive.current) setPlans(list)
    } catch {
      if (alive.current) setPlans([])
    }
  }

  // 起動時: 復元 → 保存済み一覧の読み込み → 自動保存の開始
  useEffect(() => {
    alive.current = true
    let stopAutosave: (() => void) | undefined

    const boot = async (): Promise<void> => {
      const restored = await restoreInitialPlan()
      if (restored.error !== null) {
        flash('warn', T.plans.restoreError)
      } else if (restored.source === 'url') {
        flash('info', withWarnings(T.plans.restoredFromUrl, restored.warnings.length))
        // 共有内容をそのまま自動保存に移し、アドレスバーからは外す。
        // 残したままだと「共有URLで開いて編集 → リロード」で編集が消えて見える。
        await saveAutosaveNow()
        history.replaceState(null, '', stripPlanParam(location.href))
      } else if (restored.source === 'autosave') {
        flash('info', withWarnings(T.plans.restoredFromAutosave, restored.warnings.length))
      }
      await reload()
      if (alive.current) stopAutosave = startAutosave()
    }

    void boot()

    // アドレスバーに共有URLを貼られた場合（リロードは起きない）
    const onHashChange = (): void => {
      void applyPlanFromHash(location.hash).then(async (r) => {
        if (r.source === 'url') {
          flash('info', withWarnings(T.plans.restoredFromUrl, r.warnings.length))
          await saveAutosaveNow()
          history.replaceState(null, '', stripPlanParam(location.href))
        } else if (r.error !== null) {
          flash('warn', T.plans.restoreError)
        }
      })
    }
    window.addEventListener('hashchange', onHashChange)

    return () => {
      alive.current = false
      window.removeEventListener('hashchange', onHashChange)
      if (noticeTimer.current !== undefined) clearTimeout(noticeTimer.current)
      stopAutosave?.()
    }
    // マウント時のみ（起動時の復元は1回だけでよい）
  }, [])

  const save = async (): Promise<void> => {
    const name = planName.trim()
    if (name === '') {
      flash('warn', T.plans.nameRequired)
      return
    }
    try {
      const existed = plans.some((p) => p.name === name)
      await planStorage().save(name, currentSnapshot())
      await reload()
      flash('info', existed ? T.plans.overwritten(name) : T.plans.saved(name))
    } catch {
      flash('warn', T.plans.storageFailed)
    }
  }

  const load = async (plan: SavedPlan): Promise<void> => {
    const parsed = parsePlanSnapshot(plan.snapshot)
    if (!parsed.ok) {
      flash('warn', T.plans.restoreError)
      return
    }
    applyPlan({ ...parsed.input, planName: plan.name })
    flash('info', withWarnings(T.plans.loaded(plan.name), parsed.warnings.length))
  }

  const remove = async (plan: SavedPlan): Promise<void> => {
    if (!window.confirm(T.plans.confirmRemove(plan.name))) return
    try {
      await planStorage().remove(plan.id)
      await reload()
      flash('info', T.plans.removed(plan.name))
    } catch {
      flash('warn', T.plans.storageFailed)
    }
  }

  const share = async (): Promise<void> => {
    // アドレスバーは書き換えない。ハッシュを残すと、以降の編集をしてリロードしたときに
    // 「共有した時点の内容」に戻ってしまい、作業が消えたように見えるため。
    const url = buildShareUrl(location.href, currentSnapshot())
    setShareUrl(url)
    try {
      await navigator.clipboard.writeText(url)
      flash('info', T.plans.shareCopied)
    } catch {
      flash('warn', T.plans.shareFailed)
    }
  }

  return (
    <CollapsiblePanel title={T.plans.heading}>
      <p className="hint">{T.plans.hint}</p>

      <label className="field">
        <span className="field__label">{T.export.planName}</span>
        <input
          type="text"
          className="input"
          value={planName}
          placeholder={T.export.planNamePlaceholder}
          onChange={(e) => setPlanName(e.target.value)}
        />
      </label>

      <div className="plan-actions">
        <button type="button" className="button button--primary" onClick={() => void save()}>
          {T.plans.save}
        </button>
        <button type="button" className="button" onClick={() => void share()}>
          {T.plans.share}
        </button>
      </div>

      {notice !== null && (
        <p className={notice.kind === 'warn' ? 'callout callout--warn' : 'callout'} role="status">
          {notice.text}
        </p>
      )}

      {shareUrl !== null && (
        <input
          type="text"
          className="input share-url"
          readOnly
          value={shareUrl}
          aria-label={T.plans.share}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}

      {plans.length === 0 ? (
        <p className="hint">{T.plans.listEmpty}</p>
      ) : (
        <ul className="plan-list">
          {plans.map((plan) => (
            <li key={plan.id} className="plan">
              <span className="plan__name">{plan.name}</span>
              <span className="plan__meta">{T.plans.updatedAt(new Date(plan.updatedAt))}</span>
              <span className="plan__actions">
                <button type="button" className="button button--small" onClick={() => void load(plan)}>
                  {T.plans.load}
                </button>
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => void remove(plan)}
                >
                  {T.plans.remove}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="hint">{T.plans.shareHint}</p>
    </CollapsiblePanel>
  )
}

const withWarnings = (text: string, count: number): string =>
  count === 0 ? text : T.plans.withWarnings(text, count)
