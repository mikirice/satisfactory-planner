/**
 * elkjs 呼び出しのラッパー。
 *
 * 既定は Web Worker（src/ui/elk-layout.worker.ts）で計算し、UI をブロックしない。
 * Worker が作れない・応答しない環境（古いブラウザ・一部の埋め込み）では
 * メインスレッド版の elk.bundled.js に自動で落とす。落ちても図は出る。
 */
import type { ElkNode } from 'elkjs/lib/elk-api'
import type { ElkLayoutRequest, ElkLayoutResponse } from './elk-layout.worker.ts'

type ElkLike = { layout: (graph: ElkNode) => Promise<ElkNode> }

/** Worker がここまでに返さなければメインスレッドへ切り替える。 */
const WORKER_TIMEOUT_MS = 8000

type Pending = {
  resolve: (graph: ElkNode) => void
  reject: (reason: Error) => void
  timer: ReturnType<typeof setTimeout>
}

let worker: Worker | null = null
let workerBroken = false
let seq = 0
const pending = new Map<number, Pending>()

function failAll(reason: Error): void {
  for (const [, entry] of pending) {
    clearTimeout(entry.timer)
    entry.reject(reason)
  }
  pending.clear()
}

function dropWorker(reason: Error): void {
  workerBroken = true
  worker?.terminate()
  worker = null
  failAll(reason)
}

function ensureWorker(): Worker | null {
  if (workerBroken || typeof Worker === 'undefined') return null
  if (worker) return worker
  try {
    const created = new Worker(new URL('./elk-layout.worker.ts', import.meta.url), {
      type: 'module',
    })
    created.addEventListener('message', (event: MessageEvent<ElkLayoutResponse>) => {
      const entry = pending.get(event.data.id)
      if (!entry) return
      pending.delete(event.data.id)
      clearTimeout(entry.timer)
      if (event.data.graph) entry.resolve(event.data.graph)
      else entry.reject(new Error(event.data.error ?? 'elk worker failed'))
    })
    created.addEventListener('error', () => dropWorker(new Error('elk worker error')))
    worker = created
    return created
  } catch {
    workerBroken = true
    return null
  }
}

function layoutInWorker(target: Worker, graph: ElkNode): Promise<ElkNode> {
  const id = ++seq
  return new Promise<ElkNode>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      dropWorker(new Error('elk worker timeout'))
      reject(new Error('elk worker timeout'))
    }, WORKER_TIMEOUT_MS)
    pending.set(id, { resolve, reject, timer })
    const request: ElkLayoutRequest = { id, graph }
    target.postMessage(request)
  })
}

let mainThread: Promise<ElkLike> | null = null

function mainThreadElk(): Promise<ElkLike> {
  mainThread ??= import('elkjs/lib/elk.bundled.js').then((module) => new module.default())
  return mainThread
}

/** レイアウト済み（x/y が入った）グラフを返す。 */
export async function runElkLayout(graph: ElkNode): Promise<ElkNode> {
  const target = ensureWorker()
  if (target) {
    try {
      return await layoutInWorker(target, graph)
    } catch {
      // Worker が死んだ場合はメインスレッドで計算し直す（図が出ないよりまし）
      dropWorker(new Error('elk worker unavailable'))
    }
  }
  const elk = await mainThreadElk()
  return elk.layout(graph)
}
