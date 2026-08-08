/** 実行不能のときの原因ヒント（Phase 2 の診断結果を日本語で読ませる）。 */
import type { InfeasibleReason, InfeasibleResult } from '../solver/index.ts'
import { fmtRate, itemName } from './format.ts'
import { T } from './text.ts'

type Props = { result: InfeasibleResult }

export function InfeasiblePanel({ result }: Props) {
  return (
    <section className="card card--wide">
      <h3 className="card__title">{T.infeasible.heading}</h3>
      <p className="hint">{T.infeasible.hint}</p>
      <ul className="reason-list">
        {result.reasons.map((reason, index) => (
          <li key={`${reason.kind}-${index}`} className="reason">
            <span className="tag is-shortage">{T.infeasible.reason[reason.kind]}</span>
            <div className="reason__body">
              <p className="reason__message">{reason.message}</p>
              {detail(reason)}
              {/* 原因ごとの個別の対処があればそれを優先する（例: 産出最大化が非有界） */}
              <p className="reason__advice">
                {('advice' in reason && reason.advice) || T.infeasible.advice[reason.kind]}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function detail(reason: InfeasibleReason) {
  if (reason.kind !== 'resourceLimit') return null
  return (
    <dl className="kv">
      <dt>{itemName(reason.item)}</dt>
      <dd className="num">
        上限 {fmtRate(reason.limitPerMin)} / 必要 {fmtRate(reason.requiredPerMin)} / 不足{' '}
        {fmtRate(reason.shortfallPerMin)}
      </dd>
    </dl>
  )
}
