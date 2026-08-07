/**
 * elkjs のレイアウト計算を回す Web Worker。
 *
 * レイアウトは 30 レシピ級で数十 ms かかる。メインスレッドで回すと入力やパンが
 * 引っかかるので、計算だけこちらに逃がす（結果は座標付きの ElkNode で返す）。
 * Worker が使えない環境では src/ui/elk-layout.ts がメインスレッドに落とす。
 */
import ELK from 'elkjs/lib/elk.bundled.js'
import type { ElkNode } from 'elkjs/lib/elk-api'

export type ElkLayoutRequest = { id: number; graph: ElkNode }
export type ElkLayoutResponse = { id: number; graph?: ElkNode; error?: string }

// Worker のグローバルは DOM の Window 型と衝突するので、使う分だけ型を付け直す。
const ctx = self as unknown as {
  addEventListener: (type: 'message', handler: (event: MessageEvent<ElkLayoutRequest>) => void) => void
  postMessage: (message: ElkLayoutResponse) => void
}

const elk = new ELK()

ctx.addEventListener('message', (event) => {
  const { id, graph } = event.data
  elk
    .layout(graph)
    .then((laid) => ctx.postMessage({ id, graph: laid }))
    .catch((error: unknown) => ctx.postMessage({ id, error: String(error) }))
})
