/**
 * 発電計画の入力（目標発電量・自給・発電方式の許可）。
 *
 * 発電機は「燃料(+水)を消費して電力を産出する変数」としてソルバーに渡る。
 * 燃料もアイテム収支に入るので、石炭の採掘・燃料の精製・ウラン燃料棒の製造まで
 * 同じ計算で一緒に出てくる（src/solver/model.ts）。
 *
 * 既定は「発電方式すべてオフ」＝ 発電計画なし。従来と同じ解になる。
 */
import { itemsById } from '../data/index.ts'
import { isPowerPlanActive, powerGenerators, usePlanner } from '../store/planner.ts'
import { fmtPower } from './format.ts'
import { T } from './text.ts'

export function PowerPanel() {
  const enabledGenerators = usePlanner((s) => s.enabledGenerators)
  const powerTargetMW = usePlanner((s) => s.powerTargetMW)
  const coverFactoryPower = usePlanner((s) => s.coverFactoryPower)
  const setGenerator = usePlanner((s) => s.setGenerator)
  const setPowerTargetMW = usePlanner((s) => s.setPowerTargetMW)
  const setCoverFactoryPower = usePlanner((s) => s.setCoverFactoryPower)

  const anyGenerator = Object.keys(enabledGenerators).length > 0
  const active = isPowerPlanActive({ enabledGenerators, powerTargetMW, coverFactoryPower })

  return (
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.power}</h2>

      <div className="checkbox-list">
        <p className="target-group__head">{T.sidebar.powerMethods}</p>
        {powerGenerators.map((generator) => (
          <label
            key={generator.id}
            className={enabledGenerators[generator.id] ? 'checkbox checkbox--on' : 'checkbox'}
          >
            <input
              type="checkbox"
              checked={enabledGenerators[generator.id] === true}
              onChange={(e) => setGenerator(generator.id, e.target.checked)}
            />
            <span className="checkbox__body">
              <span className="checkbox__label">
                {generator.name.ja}
                <span className="checkbox__meta">
                  {T.sidebar.powerGeneratorSpec(fmtPower(generator.powerProductionMW))}
                </span>
              </span>
              <span className="checkbox__hint">
                {T.sidebar.powerFuels(
                  generator.fuels
                    .map((fuel) => itemsById.get(fuel.item)?.name.ja ?? fuel.item)
                    .join('・'),
                )}
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="hint">{T.sidebar.powerMethodsHint}</p>

      <label className="field">
        <span className="field__label">{T.sidebar.powerTarget}</span>
        <span className="target__rate">
          <input
            className="input input--num"
            type="number"
            min={0}
            step={100}
            value={powerTargetMW}
            onChange={(e) => setPowerTargetMW(Number(e.target.value) || 0)}
          />
          <span className="unit">{T.sidebar.powerTargetUnit}</span>
        </span>
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={coverFactoryPower}
          onChange={(e) => setCoverFactoryPower(e.target.checked)}
        />
        <span className="checkbox__body">
          <span className="checkbox__label">{T.sidebar.powerCover}</span>
          <span className="checkbox__hint">{T.sidebar.powerCoverHint}</span>
        </span>
      </label>

      {!anyGenerator && (powerTargetMW > 0 || coverFactoryPower) && (
        <p className="callout callout--warn">{T.sidebar.powerNoMethod}</p>
      )}
      {anyGenerator && !active && <p className="hint">{T.sidebar.powerIdle}</p>}
      <p className="hint">{T.sidebar.powerClockNote}</p>
    </section>
  )
}
