/**
 * 空状態とループモードのサイドバーで共用するテンプレートギャラリー。
 *
 * 初見の人は目標欄が空のまま止まりやすいので、クリックひとつで結果まで届く例を置く。
 * 空状態には基本サンプル、ループモードには特殊テンプレートだけを出す。
 *
 * 読み込みは保存/共有と同じ経路（parsePlanSnapshot → applyPlan）を通す。
 * サンプル専用の投入口を作らないので、ここが壊れるときは保存/共有も壊れている。
 */
import { useState } from 'react'

import { resolveText, useLocale } from '../i18n/index.ts'
import type { Locale } from '../i18n/index.ts'
import { SAMPLE_PLANS, TEMPLATE_CATEGORIES } from '../plan/samples.ts'
import type { SamplePlan } from '../plan/samples.ts'
import { parsePlanSnapshot } from '../plan/serialize.ts'
import { hasAnyInput, usePlanner } from '../store/planner.ts'
import { itemName } from './format.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { ROW_ICON } from './ItemSearchBox.tsx'
import { T } from './text.ts'

type SamplesPanelProps = {
  variant?: 'empty' | 'loop'
}

const LOOP_GUIDE_SEEN_KEY = 'satisfactory-planner:loop-guide-seen'

export function SamplesPanel({ variant = 'empty' }: SamplesPanelProps) {
  const { locale } = useLocale()
  const [guideOpen, setGuideOpen] = useState(
    () => variant === 'loop' && sessionStorage.getItem(LOOP_GUIDE_SEEN_KEY) !== '1',
  )
  const applyPlan = usePlanner((s) => s.applyPlan)
  const hasWork = usePlanner(hasAnyInput)
  const planName = usePlanner((s) => s.planName)
  // planName だけを触った場合も、従来どおり空状態には割り込まない。
  const untouched = !hasWork && planName === ''

  if (variant === 'empty' && !untouched) return null

  const load = (sample: SamplePlan): void => {
    const title = sampleTitle(sample, locale)
    if (hasWork && !window.confirm(T.samples.confirmReplace(title))) return
    const parsed = parsePlanSnapshot(sample.snapshot)
    // ゲームデータ更新でIDが消えた場合。壊れた入力を流し込むより何もしないほうが安全
    if (!parsed.ok) return
    applyPlan({ ...parsed.input, planName: title }, sample.id)
    if (variant === 'loop') {
      sessionStorage.setItem(LOOP_GUIDE_SEEN_KEY, '1')
      setGuideOpen(false)
    }
  }

  const categoryId = variant === 'loop' ? 'special' : 'basic'
  const category = TEMPLATE_CATEGORIES.find((entry) => entry.id === categoryId)!
  const samples = SAMPLE_PLANS.filter((sample) => sample.category === categoryId)
  const gallery = (
    <div className={variant === 'loop' ? 'panel__body' : undefined}>
      <p className="hint">{variant === 'loop' ? T.samples.loopHint : T.samples.hint}</p>
      <section className="samples__category">
        <h4 className="card__subtitle">
          {locale === 'en' ? category.titleEn : category.title}
        </h4>
        <ul className="samples__list">
          {samples.map((sample) => (
            <li key={sample.id}>
              <button type="button" className="button sample" onClick={() => load(sample)}>
                <span className="sample__title">
                  <ItemIcon id={sample.icon} name={itemName(sample.icon)} size={ROW_ICON} />
                  {sampleTitle(sample, locale)}
                </span>
                <span className="sample__desc">{sampleDescription(sample, locale)}</span>
                {locale === 'ja' && sample.highlight && (
                  <span className="sample__highlight">
                    <span className="sample__highlight-label">{T.samples.highlight}:</span>{' '}
                    {sample.highlight}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )

  if (variant === 'loop') {
    return (
      <section className="panel samples samples--loop">
        <h2 className="panel__title">{T.samples.loopHeading}</h2>
        <details
          className="loop-guide"
          open={guideOpen}
          onToggle={(event) => setGuideOpen(event.currentTarget.open)}
        >
          <summary>{T.samples.guideHeading}</summary>
          <ul>
            {T.samples.guideLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
        {gallery}
        <p className="hint">{T.samples.editHint}</p>
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

function sampleTitle(sample: SamplePlan, locale: Locale): string {
  return resolveText(locale === 'en' ? sample.titleEn : sample.title, locale)
}

function sampleDescription(sample: SamplePlan, locale: Locale): string {
  return resolveText(locale === 'en' ? sample.descriptionEn : sample.description, locale)
}
