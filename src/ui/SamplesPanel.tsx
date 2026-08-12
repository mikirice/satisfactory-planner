/**
 * 空状態とサイドバーで共用するテンプレートギャラリー。
 *
 * 初見の人は目標欄が空のまま止まりやすいので、クリックひとつで結果まで届く例を置く。
 * 空状態では従来どおり常にカードを出し、サイドバーでは折りたたんで常時アクセスできる。
 *
 * 読み込みは保存/共有と同じ経路（parsePlanSnapshot → applyPlan）を通す。
 * サンプル専用の投入口を作らないので、ここが壊れるときは保存/共有も壊れている。
 */
import { useState } from 'react'

import { SAMPLE_PLANS, TEMPLATE_CATEGORIES } from '../plan/samples.ts'
import type { SamplePlan } from '../plan/samples.ts'
import { parsePlanSnapshot } from '../plan/serialize.ts'
import { hasAnyInput, usePlanner } from '../store/planner.ts'
import { itemName } from './format.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { ROW_ICON } from './ItemSearchBox.tsx'
import { T } from './text.ts'

type SamplesPanelProps = {
  variant?: 'empty' | 'sidebar'
}

export function SamplesPanel({ variant = 'empty' }: SamplesPanelProps) {
  const applyPlan = usePlanner((s) => s.applyPlan)
  const hasWork = usePlanner(hasAnyInput)
  const planName = usePlanner((s) => s.planName)
  const [open, setOpen] = useState(false)
  // planName だけを触った場合も、従来どおり空状態には割り込まない。
  const untouched = !hasWork && planName === ''

  if (variant === 'empty' && !untouched) return null

  const load = (sample: SamplePlan): void => {
    if (hasWork && !window.confirm(T.samples.confirmReplace(sample.title))) return
    const parsed = parsePlanSnapshot(sample.snapshot)
    // ゲームデータ更新でIDが消えた場合。壊れた入力を流し込むより何もしないほうが安全
    if (!parsed.ok) return
    applyPlan(parsed.input)
    if (variant === 'sidebar') setOpen(false)
  }

  const gallery = (
    <div className={variant === 'sidebar' ? 'panel__body' : undefined}>
      <p className="hint">{T.samples.hint}</p>
      {TEMPLATE_CATEGORIES.map((category) => (
        <section className="samples__category" key={category.id}>
          <h4 className="card__subtitle">{category.title}</h4>
          <ul className="samples__list">
            {SAMPLE_PLANS.filter((sample) => sample.category === category.id).map((sample) => (
              <li key={sample.id}>
                <button type="button" className="button sample" onClick={() => load(sample)}>
                  <span className="sample__title">
                    <ItemIcon id={sample.icon} name={itemName(sample.icon)} size={ROW_ICON} />
                    {sample.title}
                  </span>
                  <span className="sample__desc">{sample.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )

  if (variant === 'sidebar') {
    return (
      <section className="panel samples samples--sidebar">
        <button
          type="button"
          className="panel__toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="panel__title">{T.samples.sidebarHeading}</span>
          <span className="panel__meta">{T.samples.count(SAMPLE_PLANS.length)}</span>
          <span className="panel__caret">{open ? '閉じる' : '開く'}</span>
        </button>
        {open && gallery}
      </section>
    )
  }

  return (
    <section className="card card--wide samples">
      <h3 className="card__title">{T.samples.heading}</h3>
      {gallery}
    </section>
  )
}
