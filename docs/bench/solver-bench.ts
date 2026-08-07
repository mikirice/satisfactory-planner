/**
 * ソルバー選定ベンチ: glpk.js vs highs-js（HiGHS WASM）。
 *
 *   npm i --no-save highs@1        # 不採用側。依存に入れていないので都度入れる
 *   npx tsx docs/bench/solver-bench.ts
 *   npm uninstall highs
 *
 * 同一の定式化（src/solver/model.ts が組み立てる LpModel）を両方に食わせ、
 * 解の一致・速度・精度・配布サイズを比べる。結果は docs/solver-benchmark.md。
 *
 * このファイルは tsconfig の include（src / scripts / tests）の外に置いてある。
 * 不採用側の依存を消しても `npm run build` / `npm test` が壊れないようにするため。
 */
import { statSync } from 'node:fs'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

import { recipes } from '../../src/data/index.ts'
import { buildProductionModel } from '../../src/solver/model.ts'
import { writeLpFormat } from '../../src/solver/lp.ts'
import type { LpModel } from '../../src/solver/lp.ts'
import type { SolveInput } from '../../src/solver/types.ts'

// --- ベンチ対象のケース -------------------------------------------------------
const allRecipeIds = recipes.map((r) => r.id)
const CASES: { name: string; input: SolveInput }[] = [
  {
    name: '小: 鉄板 60/min（基本レシピのみ・66レシピ）',
    input: { targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }] },
  },
  {
    name: '中: モジュール式エンジン 10/min（全291レシピ）',
    input: {
      targets: [{ item: 'Desc_ModularFrameHeavy_C', ratePerMin: 10 }],
      enabledRecipes: allRecipeIds,
    },
  },
  {
    name: '中: ターボモーター 10/min（全291レシピ）',
    input: {
      targets: [{ item: 'Desc_MotorLightweight_C', ratePerMin: 10 }],
      enabledRecipes: allRecipeIds,
    },
  },
  {
    name: '大: ニュークリアパスタ 1/min + ターボモーター 20/min（全291レシピ）',
    input: {
      targets: [
        { item: 'Desc_SpaceElevatorPart_9_C', ratePerMin: 1 },
        { item: 'Desc_MotorLightweight_C', ratePerMin: 20 },
      ],
      enabledRecipes: allRecipeIds,
    },
  },
  {
    name: '循環: プラスチック 300/min（リサイクル系込み・全291レシピ）',
    input: {
      targets: [{ item: 'Desc_Plastic_C', ratePerMin: 300 }],
      enabledRecipes: allRecipeIds,
    },
  },
  {
    name: '巨大: 全291レシピ + 目標6種同時',
    input: {
      targets: [
        { item: 'Desc_MotorLightweight_C', ratePerMin: 20 },
        { item: 'Desc_ComputerSuper_C', ratePerMin: 10 },
        { item: 'Desc_CircuitBoardHighSpeed_C', ratePerMin: 30 },
        { item: 'Desc_ModularFrameHeavy_C', ratePerMin: 15 },
        { item: 'Desc_SpaceElevatorPart_12_C', ratePerMin: 5 },
        { item: 'Desc_Cement_C', ratePerMin: 500 },
      ],
      enabledRecipes: allRecipeIds,
    },
  },
]

// --- バックエンド -------------------------------------------------------------
type Solved = { status: string; objective: number; values: Map<string, number> }

async function makeHighs(): Promise<(m: LpModel) => Solved> {
  const highsLoader = (await import('highs')).default
  const highs = await highsLoader()
  return (model) => {
    const { text, nameByKey } = writeLpFormat(model)
    const sol = highs.solve(text, { output_flag: false, log_to_console: false })
    const values = new Map<string, number>()
    for (const [key, name] of nameByKey) {
      values.set(key, (sol.Columns as Record<string, { Primal?: number }>)[name]?.Primal ?? 0)
    }
    return { status: sol.Status, objective: sol.ObjectiveValue, values }
  }
}

async function makeGlpk(): Promise<(m: LpModel) => Solved> {
  const GLPK = (await import('glpk.js/node')).default as unknown as () => Promise<Record<string, never>>
  const glpk = (await GLPK()) as unknown as {
    GLP_MIN: number; GLP_LO: number; GLP_UP: number; GLP_DB: number; GLP_FX: number
    GLP_MSG_OFF: number; GLP_OPT: number; GLP_NOFEAS: number; GLP_UNBND: number
    solve(lp: unknown, opts: unknown): { result: { status: number; z: number; vars: Record<string, number> } }
  }
  const STATUS: Record<number, string> = {
    [glpk.GLP_OPT]: 'Optimal',
    [glpk.GLP_NOFEAS]: 'Infeasible',
    [glpk.GLP_UNBND]: 'Unbounded',
  }
  return (model) => {
    const lp = {
      name: 'production',
      objective: {
        direction: glpk.GLP_MIN,
        name: 'obj',
        vars: model.variables.filter((v) => v.objective !== 0).map((v) => ({ name: v.key, coef: v.objective })),
      },
      subjectTo: model.constraints
        .filter((c) => c.coefficients.size > 0)
        .map((c) => ({
          name: c.key,
          vars: [...c.coefficients].map(([name, coef]) => ({ name, coef })),
          bnds: { type: glpk.GLP_LO, lb: c.lower ?? 0, ub: 0 },
        })),
      bounds: model.variables
        .filter((v) => Number.isFinite(v.upper ?? Number.POSITIVE_INFINITY))
        .map((v) => ({ name: v.key, type: glpk.GLP_DB, lb: v.lower ?? 0, ub: v.upper! })),
    }
    const res = glpk.solve(lp, { msglev: glpk.GLP_MSG_OFF, presol: true })
    return {
      status: STATUS[res.result.status] ?? `code ${res.result.status}`,
      objective: res.result.z,
      values: new Map(Object.entries(res.result.vars)),
    }
  }
}

// --- 計測 ---------------------------------------------------------------------
function bench(fn: () => void, runs = 20): { median: number; min: number } {
  fn() // warm-up
  const times: number[] = []
  for (let i = 0; i < runs; i++) {
    const t = performance.now()
    fn()
    times.push(performance.now() - t)
  }
  times.sort((a, b) => a - b)
  return { median: times[Math.floor(times.length / 2)], min: times[0] }
}

function sizes(file: string): string {
  const raw = readFileSync(file)
  const kb = (n: number) => `${(n / 1024).toFixed(0)}KB`
  return `raw ${kb(statSync(file).size)} / gzip ${kb(gzipSync(raw).length)} / brotli ${kb(brotliCompressSync(raw).length)}`
}

async function main(): Promise<void> {
  console.log('## 配布サイズ')
  console.log('- highs.wasm :', sizes('node_modules/highs/build/highs.wasm'))
  console.log('- highs.js   :', sizes('node_modules/highs/build/highs.js'))
  console.log('- glpk.wasm  :', sizes('node_modules/glpk.js/dist/glpk.wasm'))
  console.log('- glpk.js    :', sizes('node_modules/glpk.js/dist/glpk.js'))
  console.log('- glpk index :', sizes('node_modules/glpk.js/dist/index.js'), '(ブラウザ版・wasm埋め込み)')
  console.log()

  const tInitHighs = performance.now()
  const highs = await makeHighs()
  const initHighs = performance.now() - tInitHighs
  const tInitGlpk = performance.now()
  const glpk = await makeGlpk()
  const initGlpk = performance.now() - tInitGlpk
  console.log(`## 初期化: highs ${initHighs.toFixed(1)}ms / glpk ${initGlpk.toFixed(1)}ms\n`)

  console.log('## ケース別')
  for (const c of CASES) {
    const model = buildProductionModel(c.input)
    const lpText = writeLpFormat(model.lp).text
    const h = highs(model.lp)
    const g = glpk(model.lp)
    const hb = bench(() => highs(model.lp))
    const gb = bench(() => glpk(model.lp))

    // 解の一致: 目的関数値と、活動しているレシピ台数の最大相対差
    const keys = new Set([...h.values.keys(), ...g.values.keys()])
    let maxRelDiff = 0
    let maxRelDiffKey = ''
    for (const k of keys) {
      const a = h.values.get(k) ?? 0
      const b = g.values.get(k) ?? 0
      const scale = Math.max(Math.abs(a), Math.abs(b), 1)
      const rel = Math.abs(a - b) / scale
      if (rel > maxRelDiff) { maxRelDiff = rel; maxRelDiffKey = k }
    }
    const objRel = Math.abs(h.objective - g.objective) / Math.max(Math.abs(h.objective), 1)

    console.log(`### ${c.name}`)
    console.log(`  変数 ${model.lp.variables.length} / 制約 ${model.lp.constraints.length} / LPテキスト ${(lpText.length / 1024).toFixed(1)}KB`)
    console.log(`  status  highs=${h.status} glpk=${g.status}`)
    console.log(`  目的関数 highs=${h.objective} glpk=${g.objective} (相対差 ${objRel.toExponential(2)})`)
    console.log(`  変数の最大相対差 ${maxRelDiff.toExponential(2)} @ ${maxRelDiffKey}`)
    console.log(`  時間(中央値) highs=${hb.median.toFixed(2)}ms glpk=${gb.median.toFixed(2)}ms`)
  }

  // 精度の確認: 1/3 が出るケース
  console.log('\n## 数値精度（10/3 = 3.3333333333333335 が返るか）')
  const tiny: LpModel = {
    direction: 'min',
    variables: [{ key: 'a', objective: 1 }, { key: 'b', objective: 1 }],
    constraints: [
      { key: 'r0', coefficients: new Map([['a', 3], ['b', -1]]), lower: 0 },
      { key: 'r1', coefficients: new Map([['b', 1]]), lower: 10 },
    ],
  }
  console.log('  highs a =', highs(tiny).values.get('a'))
  console.log('  glpk  a =', glpk(tiny).values.get('a'))
}

await main()
