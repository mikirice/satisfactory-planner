import { useEffect, useState } from 'react'

import { useLocale } from '../i18n/index.ts'
import { getLoopBaseline, hasLoopBaseline } from '../plan/loop-baseline.ts'
import type { SamplePlan } from '../plan/samples.ts'
import type { Solution, SolveResult } from '../solver/index.ts'
import { fmtInt, fmtPercent, fmtPower, fmtRate, itemName, itemUnit } from './format.ts'
import { T } from './text.ts'

type LoopGuidePanelProps = {
  sample: SamplePlan
  solution: Solution
}

type BaselineState =
  | { status: 'loading' }
  | { status: 'done'; result: SolveResult }
  | { status: 'error' }

export function LoopGuidePanel({ sample, solution }: LoopGuidePanelProps) {
  const { locale } = useLocale()
  const [open, setOpen] = useState(true)
  // 代替レシピを持つテンプレートは「代替なし」と、段階テンプレートは基準テンプレートと比べる
  const hasComparison = hasLoopBaseline(sample)
  const [baseline, setBaseline] = useState<BaselineState>({ status: 'loading' })

  useEffect(() => {
    setOpen(true)
    if (locale !== 'ja' || !hasComparison) return

    let cancelled = false
    setBaseline({ status: 'loading' })
    void getLoopBaseline(sample).then(
      (result) => {
        if (!cancelled) setBaseline({ status: 'done', result })
      },
      () => {
        if (!cancelled) setBaseline({ status: 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [hasComparison, locale, sample])

  if (sample.guide === undefined) return null

  // TODO(Stage 2): render translated per-template guides once their localized fields exist.
  if (locale !== 'ja') {
    return <p className="card card--wide hint">{T.samples.detailedGuideJapaneseOnly}</p>
  }

  return (
    <details
      className="card card--wide loop-explanation"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{T.loopGuide.heading}</summary>
      <div className="loop-explanation__body">
        <GuideSection heading={T.loopGuide.mechanism} ordered lines={sample.guide.sections.mechanism} />

        {hasComparison && (
          <section>
            <h4>{T.loopGuide.savings}</h4>
            <SavingsComparison baseline={baseline} solution={solution} />
          </section>
        )}

        {sample.guide.circulationMeaning !== undefined && (
          <section>
            <h4>{T.loopGuide.circulation}</h4>
            <p>{sample.guide.circulationMeaning}</p>
            <WaterReuse solution={solution} />
          </section>
        )}

        <GuideSection heading={T.loopGuide.tips} lines={sample.guide.sections.tips} />
      </div>
    </details>
  )
}

function GuideSection({
  heading,
  lines,
  ordered = false,
}: {
  heading: string
  lines: readonly string[]
  ordered?: boolean
}) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <section>
      <h4>{heading}</h4>
      <List>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </List>
    </section>
  )
}

function SavingsComparison({
  baseline,
  solution,
}: {
  baseline: BaselineState
  solution: Solution
}) {
  if (baseline.status === 'loading') return <p className="hint">{T.loopGuide.calculating}</p>
  if (baseline.status === 'error') return <p className="hint">{T.loopGuide.failed}</p>
  if (baseline.result.status === 'infeasible') {
    return <p>{T.loopGuide.baselineInfeasible}</p>
  }

  const currentByItem = new Map(solution.rawResources.map((raw) => [raw.item, raw.ratePerMin]))
  const savings = baseline.result.rawResources.flatMap((raw) => {
    const current = currentByItem.get(raw.item) ?? 0
    if (raw.ratePerMin - current <= 0.005) return []
    return [{ item: raw.item, baseline: raw.ratePerMin, current }]
  })
  const powerChange = notablePowerChange(baseline.result.totalClockedPowerMW, solution.totalClockedPowerMW)
  // 発電機の台数と、余る副産物（核廃棄物）。段階テンプレートの比較で意味を持つ行なので、
  // 差が無いときは出さない（既存テンプレートの表示を変えない）
  const generatorChange = generatorCountChange(baseline.result, solution)
  const byproductChanges = byproductSurplusChanges(baseline.result, solution)

  if (
    savings.length === 0 &&
    powerChange === null &&
    generatorChange === null &&
    byproductChanges.length === 0
  ) {
    return <p className="hint">{T.loopGuide.noSavings}</p>
  }

  return (
    <ul className="loop-explanation__comparison">
      {savings.map((entry) => (
        <li key={entry.item}>
          {itemName(entry.item)} {fmtRate(entry.baseline)} → {fmtRate(entry.current)}{' '}
          {T.loopGuide.savingsAmount(
            itemUnit(entry.item),
            fmtPercent((entry.baseline - entry.current) / entry.baseline),
          )}
        </li>
      ))}
      {generatorChange !== null && (
        <li>
          {T.summary.powerGenerationCount} {fmtInt(generatorChange.baseline)} →{' '}
          {fmtInt(generatorChange.current)}
          {T.summary.powerGenerationCountUnit}
        </li>
      )}
      {byproductChanges.map((entry) => (
        <li key={entry.item}>
          {T.summary.byproducts} {itemName(entry.item)} {fmtRate(entry.baseline)} →{' '}
          {fmtRate(entry.current)} {itemUnit(entry.item)}
        </li>
      ))}
      {powerChange !== null && (
        <li>
          {T.loopGuide.power} {fmtPower(powerChange.baseline)} → {fmtPower(powerChange.current)} MW{' '}
          {T.loopGuide.powerChange(
            fmtPercent(powerChange.ratio),
            powerChange.current < powerChange.baseline
              ? T.loopGuide.reduced
              : T.loopGuide.increased,
          )}
        </li>
      )}
    </ul>
  )
}

function generatorCountChange(baseline: Solution, current: Solution) {
  const before = baseline.powerGeneration?.totalGeneratorCount ?? 0
  const after = current.powerGeneration?.totalGeneratorCount ?? 0
  if (before === after) return null
  return { baseline: before, current: after }
}

function byproductSurplusChanges(baseline: Solution, current: Solution) {
  const before = new Map(baseline.byproducts.map((entry) => [entry.item, entry.ratePerMin]))
  const after = new Map(current.byproducts.map((entry) => [entry.item, entry.ratePerMin]))
  const items = [...new Set([...before.keys(), ...after.keys()])]
  return items.flatMap((item) => {
    const b = before.get(item) ?? 0
    const c = after.get(item) ?? 0
    if (Math.abs(b - c) <= 0.005) return []
    return [{ item, baseline: b, current: c }]
  })
}

function notablePowerChange(baseline: number, current: number) {
  if (baseline <= 0) return null
  const ratio = Math.abs(baseline - current) / baseline
  if (Math.abs(baseline - current) < 1 || ratio < 0.05) return null
  return { baseline, current, ratio }
}

function WaterReuse({ solution }: { solution: Solution }) {
  const water = solution.itemBalance.find((balance) => balance.item === 'Desc_Water_C')
  if (water === undefined || water.producedPerMin <= 0.005) return null
  return (
    <p className="loop-explanation__metric">
      {T.loopGuide.reusedWater}: {fmtRate(water.producedPerMin)} m³/min
    </p>
  )
}
