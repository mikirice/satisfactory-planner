/** アイテム収支表（産出 / 消費 / 外部供給 / 差分）。 */
import { useState } from 'react'

import type { ItemBalance, Solution } from '../solver/index.ts'
import { fmtRate, itemName, itemUnit } from './format.ts'
import { T } from './text.ts'

type Props = { solution: Solution }

/** これ未満の差分は「均衡」とみなす（LP の数値誤差） */
const EPS = 1e-6

export function BalanceTable({ solution }: Props) {
  const [hideBalanced, setHideBalanced] = useState(false)
  if (solution.itemBalance.length === 0) return <p className="hint">{T.balance.empty}</p>

  const rows = hideBalanced
    ? solution.itemBalance.filter((b) => Math.abs(b.netPerMin) > EPS)
    : solution.itemBalance

  return (
    <div className="stack">
      <label className="check">
        <input
          type="checkbox"
          checked={hideBalanced}
          onChange={(e) => setHideBalanced(e.target.checked)}
        />
        <span>{T.balance.onlyNonZero}</span>
      </label>
      <section className="card card--wide">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{T.balance.item}</th>
              <th scope="col" className="num">{T.balance.produced}</th>
              <th scope="col" className="num">{T.balance.consumed}</th>
              <th scope="col" className="num">{T.balance.supplied}</th>
              <th scope="col" className="num">{T.balance.net}</th>
              <th scope="col">{T.balance.state}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((balance) => (
              <tr key={balance.item}>
                <th scope="row">
                  {itemName(balance.item)}
                  <span className="unit"> {itemUnit(balance.item)}</span>
                </th>
                <td className="num">{fmtRate(balance.producedPerMin)}</td>
                <td className="num">{fmtRate(balance.consumedPerMin)}</td>
                <td className="num">{fmtRate(balance.suppliedPerMin)}</td>
                <td className={`num ${netClass(balance)}`}>{fmtRate(balance.netPerMin)}</td>
                <td>
                  <span className={`tag ${netClass(balance)}`}>{stateLabel(balance)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function netClass(balance: ItemBalance): string {
  if (balance.netPerMin > EPS) return 'is-surplus'
  if (balance.netPerMin < -EPS) return 'is-shortage'
  return 'is-balanced'
}

function stateLabel(balance: ItemBalance): string {
  if (balance.netPerMin > EPS) return T.balance.surplus
  if (balance.netPerMin < -EPS) return T.balance.shortage
  return T.balance.balanced
}
