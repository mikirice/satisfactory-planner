/**
 * 「発電を隠す」トグル（生産ステップ表とフローチャートで共有）。
 *
 * 表示だけの絞り込みなので、状態は ResultView が持つ（保存しない・URLにも入れない）。
 * 発電計画が無効な解では呼び出し側でそもそも描かない。
 */
import { T } from './text.ts'

type Props = {
  hidePower: boolean
  /** 隠しているステップ数（0 なら注記を出さない） */
  hiddenStepCount: number
  /** 未指定なら操作しても何も起きない（単体レンダリング用） */
  onChange?: (next: boolean) => void
}

export function PowerFilterToggle({ hidePower, hiddenStepCount, onChange }: Props) {
  return (
    <div className="power-filter">
      <label className="check">
        <input
          type="checkbox"
          checked={hidePower}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span>{T.powerFilter.hideLabel}</span>
      </label>
      <p className="hint">
        {hidePower && hiddenStepCount > 0
          ? T.powerFilter.hiddenNote(hiddenStepCount)
          : T.powerFilter.hideHint}
      </p>
    </div>
  )
}
