/** 目的関数プリセット・採掘設備・搬送手段の選択。 */
import { belts, extractorsById, pipes } from '../data/index.ts'
import { MINER_IDS } from '../solver/index.ts'
import { OBJECTIVE_PRESETS, usePlanner } from '../store/planner.ts'
import { T } from './text.ts'

export function ObjectivePanel() {
  const objective = usePlanner((s) => s.objective)
  const setObjective = usePlanner((s) => s.setObjective)

  return (
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.objective}</h2>
      <div className="radio-list">
        {OBJECTIVE_PRESETS.map((preset) => (
          <label
            key={preset.id}
            className={preset.id === objective ? 'radio radio--on' : 'radio'}
          >
            <input
              type="radio"
              name="objective"
              value={preset.id}
              checked={preset.id === objective}
              onChange={() => setObjective(preset.id)}
            />
            <span className="radio__body">
              <span className="radio__label">{preset.label}</span>
              <span className="radio__hint">{preset.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}

export function ExtractionPanel() {
  const minerId = usePlanner((s) => s.minerId)
  const setMinerId = usePlanner((s) => s.setMinerId)

  return (
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.extraction}</h2>
      <label className="field">
        <span className="field__label">{T.sidebar.miner}</span>
        <select className="input" value={minerId} onChange={(e) => setMinerId(e.target.value)}>
          {MINER_IDS.map((id) => {
            const extractor = extractorsById.get(id)!
            return (
              <option key={id} value={id}>
                {extractor.name.ja}（{extractor.baseRatePerMin} 個/分・通常ノード）
              </option>
            )
          })}
        </select>
      </label>
      <p className="hint">{T.sidebar.minerHint}</p>
    </section>
  )
}

export function LogisticsPanel() {
  const beltId = usePlanner((s) => s.beltId)
  const pipeId = usePlanner((s) => s.pipeId)
  const setBeltId = usePlanner((s) => s.setBeltId)
  const setPipeId = usePlanner((s) => s.setPipeId)

  return (
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.logistics}</h2>
      <label className="field">
        <span className="field__label">{T.sidebar.belt}</span>
        <select className="input" value={beltId} onChange={(e) => setBeltId(e.target.value)}>
          {belts.map((belt) => (
            <option key={belt.id} value={belt.id}>
              {belt.name.ja}（{belt.itemsPerMin} 個/分）
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">{T.sidebar.pipe}</span>
        <select className="input" value={pipeId} onChange={(e) => setPipeId(e.target.value)}>
          {pipes.map((pipe) => (
            <option key={pipe.id} value={pipe.id}>
              {pipe.name.ja}（{pipe.m3PerMin} m³/min）
            </option>
          ))}
        </select>
      </label>
      <p className="hint">{T.sidebar.logisticsHint}</p>
    </section>
  )
}
