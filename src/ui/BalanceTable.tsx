/** アイテム収支表（産出 / 消費 / 外部供給 / 差分）。 */
import { useState } from 'react'
import { useLocale } from '../i18n/index.ts'
import { buildingCapacityText } from '../i18n/building-capacity.ts'

import type { ExtractionPlan, ItemBalance, Solution } from '../solver/index.ts'
import { buildingBalance, buildingCapacityBalance } from '../plan/building-balance.ts'
import { fmtRate, itemName, itemUnit } from './format.ts'
import { ItemLabel } from './ItemIcon.tsx'
import { T } from './text.ts'

type Props = { solution: Solution; extraction?: ExtractionPlan | null }

/** これ未満の差分は「均衡」とみなす（LP の数値誤差） */
const EPS = 1e-6

export function BalanceTable({ solution, extraction = null }: Props) {
  const { locale } = useLocale()
  const [hideBalanced, setHideBalanced] = useState(false)
  if (solution.itemBalance.length === 0) return <p className="hint">{T.balance.empty}</p>

  const balances = buildingBalance(solution, extraction)
  const capacities = new Map(buildingCapacityBalance(solution, extraction).map((r) => [r.item, r]))
  const P = buildingCapacityText(locale)
  const rows = hideBalanced
    ? balances.filter((b) => Math.abs(b.netPerMin) > EPS)
    : balances

  return (
    <div className="stack">
      <p className="hint">{buildingCapacityText(locale).note}</p>
      <label className="check">
        <input
          type="checkbox"
          checked={hideBalanced}
          onChange={(e) => setHideBalanced(e.target.checked)}
        />
        <span>{T.balance.onlyNonZero}</span>
      </label>
      <section className="card card--wide">
        <div className="table-scroll">
          <table className="table balance-table">
          <thead>
            <tr>
              <th scope="col">{T.balance.item}</th>
              <th scope="col" className="num">{T.balance.produced}</th>
              <th scope="col" className="num">{P.outputLimit}</th>
              <th scope="col" className="num">{T.balance.consumed}</th>
              <th scope="col" className="num">{P.consumptionLimit}</th>
              <th scope="col" className="num">{T.balance.supplied}</th>
              <th scope="col" className="num">{T.balance.net}</th>
              <th scope="col">{T.balance.state}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((balance) => (
              <tr key={balance.item}>
                <th scope="row">
                  <ItemLabel id={balance.item} name={itemName(balance.item)}>
                    <span className="unit"> {itemUnit(balance.item)}</span>
                  </ItemLabel>
                </th>
                <td className="num">{fmtRate(balance.producedPerMin)}</td>
                <td className="num">{fmtRate(capacities.get(balance.item)?.producedPerMin ?? 0)}</td>
                <td className="num">{fmtRate(balance.consumedPerMin)}</td>
                <td className="num">{fmtRate(capacities.get(balance.item)?.consumedPerMin ?? 0)}</td>
                <td className="num">{fmtRate(balance.suppliedPerMin)}</td>
                <td className={`num ${netClass(balance)}`}>{fmtRate(balance.netPerMin)}</td>
                <td>
                  <span className={`tag ${netClass(balance)}`}>{stateLabel(balance)}</span>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
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
