// @vitest-environment jsdom
/**
 * ループ解説パネルの「節約効果」が、基準テンプレート（baselineId）との比較を出すことの検証。
 * 原子力 ②（プルトニウムまで再処理）を ①（ウラン発電）と比べ、ウランの削減・発電機の台数・
 * 余る廃棄物の行がソルバーの実値で並ぶことを固定する。
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

// jsdom では window があるためブラウザ版 glpk（Web Worker）が選ばれて動かない。
// glpk.js だけ Node 版に差し替え、ソルバー本体（モデル構築・後処理）は本物を通す。
vi.mock('glpk.js', () => import('glpk.js/node'))

import { solveSampleSnapshot } from '../src/plan/loop-baseline.ts'
import { SAMPLE_PLANS } from '../src/plan/samples.ts'
import { LoopGuidePanel } from '../src/ui/LoopGuidePanel.tsx'

const mounted: { unmount: () => void }[] = []

afterEach(() => {
  for (const entry of mounted.splice(0)) entry.unmount()
  document.body.innerHTML = ''
})

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error('timeout')
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
  }
}

describe('ループ解説パネルの基準テンプレート比較', () => {
  it('原子力 ② は ① と比べたウラン削減・発電機の台数・余る廃棄物を出す', async () => {
    const sample = SAMPLE_PLANS.find((entry) => entry.id === 'nuclear-plutonium')!
    const solution = await solveSampleSnapshot(sample.snapshot, { alternates: true })
    if (solution.status !== 'optimal') throw new Error(solution.message)

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(<LoopGuidePanel sample={sample} solution={solution} />)
    })
    mounted.push({ unmount: () => root.unmount() })

    await waitFor(() => container.querySelector('.loop-explanation__comparison') !== null)
    const text = container.querySelector('.loop-explanation__comparison')!.textContent ?? ''
    expect(text).toContain('ウラン 40.00 → 26.67')
    expect(text).toContain('33.3% 削減')
    expect(text).toContain('発電機（建てる台数） 2 → 3台')
    expect(text).toContain('副産物 ウラン廃棄物 20.00 → 0.00')
    expect(text).toContain('副産物 プルトニウム廃棄物 0.00 → 0.67')
  })
})
