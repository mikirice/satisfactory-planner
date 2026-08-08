/**
 * プランの保存・共有（Phase 6）のテスト。
 *
 * ここで守りたいのは3点:
 *  - 入力を往復（保存→復元）しても内容が変わらない
 *  - 壊れたデータ・未知バージョンは拒否して既定状態のままにする
 *  - ゲームデータ更新で消えたIDは黙って落とさず警告として返す
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AUTOSAVE_DEBOUNCE_MS,
  currentSnapshot,
  restoreInitialPlan,
  startAutosave,
} from '../src/plan/persist.ts'
import {
  PLAN_SCHEMA_VERSION,
  buildShareUrl,
  decodePlan,
  defaultPlanInput,
  encodePlan,
  parsePlanSnapshot,
  readPlanParam,
  stripPlanParam,
  toPlanSnapshot,
} from '../src/plan/serialize.ts'
import type { PlanSnapshot, PlanSource } from '../src/plan/serialize.ts'
import { createMemoryPlanStorage, setPlanStorage } from '../src/plan/storage.ts'
import type { PlanStorage } from '../src/plan/storage.ts'
import { DEFAULT_BELT_ID, DEFAULT_PIPE_ID, usePlanner } from '../src/store/planner.ts'
import { DEFAULT_MINER_ID } from '../src/solver/index.ts'

const ALT_RECIPE = 'Recipe_Alternate_AdheredIronPlate_C'

const source: PlanSource = {
  targets: [
    { key: 't1', item: 'Desc_IronPlate_C', ratePerMin: 60 },
    { key: 't2', item: 'Desc_IronPlateReinforced_C', ratePerMin: 12.5 },
  ],
  enabledAlternates: { [ALT_RECIPE]: true },
  limitOverrides: { Desc_OreIron_C: 480, Desc_Water_C: null },
  objective: 'power',
  minerId: 'Build_MinerMk2_C',
  planName: '鉄板ライン',
  beltId: 'Build_ConveyorBeltMk1_C',
  pipeId: DEFAULT_PIPE_ID,
}

/** store を初期状態に戻す（テスト間で入力が漏れないように） */
function resetStore(): void {
  usePlanner.setState({
    targets: [],
    enabledAlternates: {},
    limitOverrides: {},
    objective: 'resources',
    minerId: DEFAULT_MINER_ID,
    planName: '',
    beltId: DEFAULT_BELT_ID,
    pipeId: DEFAULT_PIPE_ID,
    status: 'idle',
    result: null,
    extraction: null,
    error: null,
    elapsedMs: 0,
  })
}

describe('プランのシリアライズ', () => {
  it('保存 → 復元で入力が一致する', () => {
    const snapshot = toPlanSnapshot(source)
    expect(snapshot.v).toBe(PLAN_SCHEMA_VERSION)

    const parsed = parsePlanSnapshot(snapshot)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.warnings).toEqual([])
    expect(parsed.input).toEqual({
      targets: [
        { item: 'Desc_IronPlate_C', ratePerMin: 60 },
        { item: 'Desc_IronPlateReinforced_C', ratePerMin: 12.5 },
      ],
      enabledAlternates: { [ALT_RECIPE]: true },
      limitOverrides: { Desc_OreIron_C: 480, Desc_Water_C: null },
      objective: 'power',
      minerId: 'Build_MinerMk2_C',
      planName: '鉄板ライン',
      beltId: 'Build_ConveyorBeltMk1_C',
      pipeId: DEFAULT_PIPE_ID,
    })
  })

  it('解（Solution）は保存しない — 入っているのは入力だけ', () => {
    const snapshot = toPlanSnapshot(source) as unknown as Record<string, unknown>
    expect(Object.keys(snapshot).sort()).toEqual(['a', 'b', 'l', 'm', 'n', 'o', 'p', 't', 'v'])
    expect(JSON.stringify(snapshot)).not.toContain('steps')
  })

  it('壊れたデータ・未知バージョンは拒否する', () => {
    for (const bad of [null, undefined, 42, 'plan', [], {}, { v: '1' }]) {
      expect(parsePlanSnapshot(bad).ok).toBe(false)
    }
    const future = { ...toPlanSnapshot(source), v: PLAN_SCHEMA_VERSION + 1 }
    const rejected = parsePlanSnapshot(future)
    expect(rejected.ok).toBe(false)
    if (!rejected.ok) expect(rejected.error).toContain('バージョン')

    // 必須フィールドの型が違う
    expect(parsePlanSnapshot({ v: PLAN_SCHEMA_VERSION, t: 'x', a: [], l: {} }).ok).toBe(false)
    expect(parsePlanSnapshot({ v: PLAN_SCHEMA_VERSION, t: [], a: {}, l: {} }).ok).toBe(false)
    expect(parsePlanSnapshot({ v: PLAN_SCHEMA_VERSION, t: [], a: [], l: [] }).ok).toBe(false)
  })

  it('消えたアイテム/レシピIDは無視して警告に出す', () => {
    const snapshot: PlanSnapshot = {
      v: PLAN_SCHEMA_VERSION,
      n: '旧データ',
      t: [
        ['Desc_IronPlate_C', 60],
        ['Desc_RemovedItem_C', 30],
        ['Desc_IronPlate_C', -5],
      ],
      a: [ALT_RECIPE, 'Recipe_Alternate_Removed_C', 'Recipe_IngotIron_C'],
      l: { Desc_OreIron_C: 480, Desc_RemovedOre_C: 100 },
      o: 'unknown-objective',
      m: 'Build_MinerMk9_C',
      b: 'Build_ConveyorBeltMk9_C',
      p: DEFAULT_PIPE_ID,
    }
    const parsed = parsePlanSnapshot(snapshot)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.input.targets).toEqual([{ item: 'Desc_IronPlate_C', ratePerMin: 60 }])
    expect(parsed.input.enabledAlternates).toEqual({ [ALT_RECIPE]: true })
    expect(parsed.input.limitOverrides).toEqual({ Desc_OreIron_C: 480 })
    // 不明な値は既定に戻す（拒否ではなくフォールバック）
    expect(parsed.input.objective).toBe(defaultPlanInput().objective)
    expect(parsed.input.minerId).toBe(DEFAULT_MINER_ID)
    expect(parsed.input.beltId).toBe(DEFAULT_BELT_ID)

    const joined = parsed.warnings.join('\n')
    expect(parsed.warnings.length).toBe(8) // 不正レート1件を含む
    expect(joined).toContain('Desc_RemovedItem_C')
    expect(joined).toContain('Recipe_Alternate_Removed_C')
    expect(joined).toContain('Recipe_IngotIron_C') // 代替ではない通常レシピ
    expect(joined).toContain('Desc_RemovedOre_C')
    expect(joined).toContain('目的関数')
    expect(joined).toContain('採掘機')
    expect(joined).toContain('ベルト')
  })
})

describe('URL共有', () => {
  it('圧縮 → 展開で往復する', () => {
    const snapshot = toPlanSnapshot(source)
    const encoded = encodePlan(snapshot)
    // 短いプランでは圧縮が効かず少し伸びる。URLに載る長さに収まっていればよい
    expect(encoded.length).toBeLessThan(2000)

    const decoded = decodePlan(encoded)
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return
    expect(decoded.input.targets).toHaveLength(2)
    expect(decoded.input.planName).toBe('鉄板ライン')
  })

  it('壊れた共有データは拒否する', () => {
    expect(decodePlan('').ok).toBe(false)
    expect(decodePlan('!!!!not-lz-string!!!!').ok).toBe(false)
    expect(decodePlan(encodePlan({ v: 99 } as unknown as PlanSnapshot)).ok).toBe(false)
  })

  it('ハッシュから plan を取り出す（+ を空白にしない）', () => {
    expect(readPlanParam('')).toBeNull()
    expect(readPlanParam('#')).toBeNull()
    expect(readPlanParam('#other=1')).toBeNull()
    expect(readPlanParam('#plan=')).toBeNull()
    expect(readPlanParam('#plan=AbC')).toBe('AbC')
    expect(readPlanParam('#other=1&plan=AbC')).toBe('AbC')
    // lz-string の URI-safe 文字集合には + が含まれる
    expect(readPlanParam('#plan=A+B-C$D')).toBe('A+B-C$D')
    expect(readPlanParam('#plan=A%2BB')).toBe('A+B')
  })

  it('復元後にハッシュから plan だけを外せる', () => {
    expect(stripPlanParam('https://example.com/?x=1#plan=ABC')).toBe('https://example.com/?x=1')
    expect(stripPlanParam('https://example.com/#tab=flow&plan=ABC')).toBe(
      'https://example.com/#tab=flow',
    )
    expect(stripPlanParam('https://example.com/')).toBe('https://example.com/')
  })

  it('共有URLは既存のハッシュを置き換える', () => {
    const snapshot = toPlanSnapshot(source)
    const url = buildShareUrl('https://example.com/planner/?x=1#plan=OLD', snapshot)
    expect(url.startsWith('https://example.com/planner/?x=1#plan=')).toBe(true)
    const round = decodePlan(readPlanParam(new URL(url).hash)!)
    expect(round.ok).toBe(true)
    if (round.ok) expect(round.input.planName).toBe('鉄板ライン')
  })
})

describe('ローカル保存（IndexedDB のインターフェース）', () => {
  let storage: PlanStorage

  beforeEach(() => {
    storage = createMemoryPlanStorage()
  })

  it('保存・一覧・読込・削除ができ、同名は上書きになる', async () => {
    const a = await storage.save('鉄板', toPlanSnapshot(source), 1000)
    const b = await storage.save('モジュラーフレーム', toPlanSnapshot(source), 2000)
    expect((await storage.list()).map((p) => p.name)).toEqual(['モジュラーフレーム', '鉄板'])

    const again = await storage.save('鉄板', toPlanSnapshot({ ...source, planName: '鉄板' }), 3000)
    expect(again.id).toBe(a.id) // 同名は同じレコードを更新
    const list = await storage.list()
    expect(list).toHaveLength(2)
    expect(list[0]!.name).toBe('鉄板') // 更新日時の新しい順
    expect((await storage.get(a.id))?.updatedAt).toBe(3000)

    await storage.remove(b.id)
    expect((await storage.list()).map((p) => p.name)).toEqual(['鉄板'])
    expect(await storage.get(b.id)).toBeUndefined()
  })

  it('自動保存は最後の1件だけ持つ', async () => {
    expect(await storage.getAutosave()).toBeNull()
    await storage.putAutosave(toPlanSnapshot(source))
    await storage.putAutosave(toPlanSnapshot({ ...source, planName: '別のプラン' }))
    expect((await storage.getAutosave())?.n).toBe('別のプラン')
  })
})

describe('自動保存と起動時の復元', () => {
  let storage: PlanStorage

  beforeEach(() => {
    vi.useFakeTimers()
    storage = createMemoryPlanStorage()
    setPlanStorage(storage)
    resetStore()
  })

  afterEach(() => {
    vi.clearAllTimers() // 再計算のデバウンスを持ち越さない
    vi.useRealTimers()
    setPlanStorage(null)
    resetStore()
  })

  it('入力を変えるとデバウンス後に自動保存される', async () => {
    const stop = startAutosave()
    usePlanner.getState().setPlanName('鉄板ライン')

    expect(await storage.getAutosave()).toBeNull() // まだ書かない
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS)

    const saved = await storage.getAutosave()
    expect(saved?.n).toBe('鉄板ライン')
    stop()
  })

  it('解が更新されただけでは自動保存しない（保存対象は入力だけ）', async () => {
    const stop = startAutosave()
    usePlanner.setState({ status: 'done', elapsedMs: 12 })
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS * 2)
    expect(await storage.getAutosave()).toBeNull()
    stop()
  })

  it('停止したら書き込まない', async () => {
    const stop = startAutosave()
    stop()
    usePlanner.getState().setPlanName('捨てるプラン')
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS * 2)
    expect(await storage.getAutosave()).toBeNull()
  })

  it('自動保存から復元する', async () => {
    await storage.putAutosave(toPlanSnapshot(source))
    const restored = await restoreInitialPlan('')
    expect(restored.source).toBe('autosave')
    expect(restored.error).toBeNull()

    const state = usePlanner.getState()
    expect(state.planName).toBe('鉄板ライン')
    expect(state.targets.map((t) => t.item)).toEqual([
      'Desc_IronPlate_C',
      'Desc_IronPlateReinforced_C',
    ])
    expect(state.objective).toBe('power')
    expect(state.enabledAlternates).toEqual({ [ALT_RECIPE]: true })
    // key は復元時に採番し直す（重複しない）
    expect(new Set(state.targets.map((t) => t.key)).size).toBe(2)
  })

  it('URLハッシュがあれば自動保存より優先する', async () => {
    await storage.putAutosave(toPlanSnapshot({ ...source, planName: '自動保存のほう' }))
    const encoded = encodePlan(toPlanSnapshot({ ...source, planName: '共有URLのほう' }))

    const restored = await restoreInitialPlan(`#plan=${encoded}`)
    expect(restored.source).toBe('url')
    expect(usePlanner.getState().planName).toBe('共有URLのほう')
  })

  it('壊れた共有データなら何も適用せず理由を返す', async () => {
    const restored = await restoreInitialPlan('#plan=!!!broken!!!')
    expect(restored.source).toBe('none')
    expect(restored.error).not.toBeNull()
    expect(usePlanner.getState().planName).toBe('')
    expect(usePlanner.getState().targets).toEqual([])
  })

  it('保存されたものが無ければ既定状態のまま', async () => {
    const restored = await restoreInitialPlan('')
    expect(restored).toEqual({ source: 'none', warnings: [], error: null })
    expect(currentSnapshot()).toEqual(toPlanSnapshot({ ...defaultPlanInput(), targets: [] }))
  })
})
