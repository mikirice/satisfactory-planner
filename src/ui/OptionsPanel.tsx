/** 目的関数プリセット・クロック / Somersloop・採掘設備・搬送手段の選択。 */
import { belts, extractorsById, pipes } from '../data/index.ts'
import {
  CLOCK_MAX,
  EXTRACTION_CLOCK_CHOICES,
  MANUFACTURING_CLOCK_MIN,
} from '../data/constants.ts'
import { MINER_IDS } from '../solver/index.ts'
import { OBJECTIVE_PRESETS, usePlanner } from '../store/planner.ts'
import { fmtClock } from './format.ts'
import { NumberField } from './NumberField.tsx'
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

/**
 * 製造クロックの上限と、使える Somersloop の数。
 *
 * クロック上限は LP を変えない（稼働台数は100%換算のまま）。
 * 「建てる台数 = 稼働台数 ÷ 上限」の後処理だけが変わる。
 * Somersloop は LP を変える（フル装着バリアントの変数が増える）。
 */
export function ClockPanel() {
  const maxClock = usePlanner((s) => s.maxClock)
  const somersloops = usePlanner((s) => s.somersloops)
  const setMaxClock = usePlanner((s) => s.setMaxClock)
  const setSomersloops = usePlanner((s) => s.setSomersloops)

  return (
    <section className="panel">
      <h2 className="panel__title">{T.sidebar.clock}</h2>
      <label className="field">
        <span className="field__label">
          {T.sidebar.clockMax}
          <span className="field__value num">{fmtClock(maxClock)}</span>
        </span>
        <input
          className="range"
          type="range"
          min={MANUFACTURING_CLOCK_MIN * 100}
          max={CLOCK_MAX * 100}
          step={10}
          value={Math.round(maxClock * 100)}
          onChange={(e) => setMaxClock(Number(e.target.value) / 100)}
        />
      </label>
      <p className="hint">{T.sidebar.clockMaxHint}</p>
      <label className="field">
        <span className="field__label">{T.sidebar.somersloops}</span>
        <NumberField
          className="input"
          min={0}
          step={1}
          value={somersloops}
          onValueChange={setSomersloops}
        />
      </label>
      <p className="hint">{T.sidebar.somersloopsHint}</p>
    </section>
  )
}

export function ExtractionPanel() {
  const minerId = usePlanner((s) => s.minerId)
  const extractionClock = usePlanner((s) => s.extractionClock)
  const setMinerId = usePlanner((s) => s.setMinerId)
  const setExtractionClock = usePlanner((s) => s.setExtractionClock)

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
      <label className="field">
        <span className="field__label">{T.sidebar.extractionClock}</span>
        <select
          className="input"
          value={extractionClock}
          onChange={(e) => setExtractionClock(Number(e.target.value))}
        >
          {EXTRACTION_CLOCK_CHOICES.map((clock) => (
            <option key={clock} value={clock}>
              {fmtClock(clock)}
            </option>
          ))}
        </select>
      </label>
      <p className="hint">{T.sidebar.minerHint}</p>
      <p className="hint">{T.sidebar.extractionClockHint}</p>
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
