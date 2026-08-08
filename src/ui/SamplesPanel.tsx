/**
 * 空状態に出す「例から始める」。
 *
 * 初見の人は目標欄が空のまま止まりやすいので、クリックひとつで結果まで届く例を置く。
 * **既に何か入力していたら出さない**（作業中の画面に例が割り込むと、押して消える事故になる）。
 *
 * 読み込みは保存/共有と同じ経路（parsePlanSnapshot → applyPlan）を通す。
 * サンプル専用の投入口を作らないので、ここが壊れるときは保存/共有も壊れている。
 */
import { SAMPLE_PLANS } from '../plan/samples.ts'
import type { SamplePlan } from '../plan/samples.ts'
import { parsePlanSnapshot } from '../plan/serialize.ts'
import { usePlanner } from '../store/planner.ts'
import { itemName } from './format.ts'
import { ItemIcon } from './ItemIcon.tsx'
import { ROW_ICON } from './ItemSearchBox.tsx'
import { T } from './text.ts'

export function SamplesPanel() {
  const applyPlan = usePlanner((s) => s.applyPlan)
  // 「まだ何も触っていない」判定。1つでも入力があれば例は出さない
  const untouched = usePlanner(
    (s) =>
      s.targets.length === 0 &&
      s.inputs.length === 0 &&
      Object.keys(s.enabledAlternates).length === 0 &&
      s.planName === '',
  )

  if (!untouched) return null

  const load = (sample: SamplePlan): void => {
    const parsed = parsePlanSnapshot(sample.snapshot)
    // ゲームデータ更新でIDが消えた場合。壊れた入力を流し込むより何もしないほうが安全
    if (!parsed.ok) return
    applyPlan(parsed.input)
  }

  return (
    <section className="card card--wide samples">
      <h3 className="card__title">{T.samples.heading}</h3>
      <p className="hint">{T.samples.hint}</p>
      <ul className="samples__list">
        {SAMPLE_PLANS.map((sample) => (
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
  )
}
