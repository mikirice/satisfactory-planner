/**
 * 共有URLの言語非依存テスト（計画書 §6 の品質保証項目 4）。
 *
 * 保存形式（PlanSnapshot）は ID だけを持ち、表示言語を一切含まない。
 * その前提が崩れると「日本語で作ったURLを英語圏の人が開くと別の計画になる」という
 * 最悪の事故になるため、ここで固定する。
 *
 * 表示側の言語切替は jsdom が要るので tests/locale.test.tsx が担当し、
 * こちらは Node 環境でしか動かせない**実際の求解**を受け持つ。
 */
import { describe, expect, it } from 'vitest'

import { resolveDisplayName } from '../src/data/index.ts'
import { SUPPORTED_LOCALES, loadGameNamePack } from '../src/i18n/index.ts'
import {
  PLAN_HASH_PARAM,
  buildShareUrl,
  decodePlan,
  encodePlan,
  readPlanParam,
  toPlanSnapshot,
} from '../src/plan/serialize.ts'
import type { PlanInput, PlanSource } from '../src/plan/serialize.ts'
import { solveProduction } from '../src/solver/index.ts'
import type { Solution } from '../src/solver/index.ts'

/** 日本語環境の利用者が作った「鉄板 60/min」の計画。 */
const planBuiltInJapanese: PlanSource = {
  targets: [{ key: 't1', item: 'Desc_IronPlate_C', ratePerMin: 60 }],
  enabledAlternates: {},
  limitOverrides: {},
  objective: 'resources',
  minerId: 'Build_MinerMk1_C',
  planName: '鉄板ライン',
  beltId: 'Build_ConveyorBeltMk5_C',
  pipeId: 'Build_PipelineMK2_C',
}

function decodeFromShareUrl(shareUrl: string): PlanInput {
  const encoded = readPlanParam(new URL(shareUrl).hash)
  if (encoded === null) throw new Error('共有URLに plan パラメータがありません')
  const parsed = decodePlan(encoded)
  if (!parsed.ok) throw new Error(`復元に失敗: ${parsed.error}`)
  expect(parsed.warnings).toEqual([])
  return parsed.input
}

async function solveIronPlate(input: PlanInput): Promise<Solution> {
  const result = await solveProduction({
    targets: input.targets.map((t) => ({ item: t.item, ratePerMin: t.ratePerMin })),
  })
  if (result.status !== 'optimal') throw new Error(`最適解になりませんでした: ${result.message}`)
  return result
}

describe('共有URLは表示言語に依存しない', () => {
  const shareUrl = buildShareUrl(
    'https://satisfactory-planner.net/',
    toPlanSnapshot(planBuiltInJapanese),
  )

  it('ペイロードに表示言語が入らない（IDのみ）', () => {
    expect(shareUrl).toContain(`#${PLAN_HASH_PARAM}=`)

    const input = decodeFromShareUrl(shareUrl)
    expect(input.targets.map((t) => [t.item, t.ratePerMin])).toEqual([['Desc_IronPlate_C', 60]])
    // 同じ内容なら何度エンコードしても同一のペイロード
    expect(encodePlan(toPlanSnapshot(planBuiltInJapanese))).toBe(
      readPlanParam(new URL(shareUrl).hash),
    )
  })

  it('ja で作ったURLを復元して解くと、既知の解（鉄鉱石90/min・製錬炉3台・製作機3台・24MW）になる', async () => {
    const solution = await solveIronPlate(decodeFromShareUrl(shareUrl))

    const machines = new Map(solution.steps.map((s) => [s.recipeId, s.machineCount]))
    expect(machines.get('Recipe_IngotIron_C')).toBeCloseTo(3, 6)
    expect(machines.get('Recipe_IronPlate_C')).toBeCloseTo(3, 6)
    expect(
      solution.rawResources.find((r) => r.item === 'Desc_OreIron_C')?.ratePerMin,
    ).toBeCloseTo(90, 6)
    expect(solution.totalPowerMW).toBeCloseTo(24, 6)
  })

  it('対応言語のどれで開いても解が完全に一致する（言語は表示名だけを変える）', async () => {
    const input = decodeFromShareUrl(shareUrl)
    const solutions = await Promise.all(SUPPORTED_LOCALES.map(() => solveIronPlate(input)))

    for (const solution of solutions) expect(solution).toEqual(solutions[0])

    // 変わってよいのは表示名だけ。IDは全言語で共通
    const recipeId = solutions[0].steps[0].recipeId
    // Tier 2 の公式名は遅延パックにあるので、言語ごとに取り寄せてから引く
    const packs = await Promise.all(SUPPORTED_LOCALES.map((locale) => loadGameNamePack(locale)))
    const names = SUPPORTED_LOCALES.map((locale, index) =>
      resolveDisplayName(recipeId, locale, packs[index]),
    )
    expect(new Set(names).size).toBe(SUPPORTED_LOCALES.length)
    expect(resolveDisplayName('Desc_IronPlate_C', 'ja')).toBe('鉄板')
    expect(resolveDisplayName('Desc_IronPlate_C', 'en')).toBe('Iron Plate')
  })

  it('利用者が付けたプラン名は翻訳せずそのまま往復する', () => {
    expect(decodeFromShareUrl(shareUrl).planName).toBe('鉄板ライン')
  })
})
