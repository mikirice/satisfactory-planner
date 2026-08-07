import { meta } from './data/index.ts'
import './App.css'

/**
 * Phase 1 のプレースホルダ。
 * UI は Phase 3（結果テーブル）から本実装する。
 */
function App() {
  return (
    <main className="app">
      <h1>Satisfactory 生産計画ツール</h1>
      <p>Phase 1: データパイプライン</p>
      <dl>
        <dt>ゲームバージョン</dt>
        <dd>{meta.gameVersion}</dd>
        <dt>アイテム</dt>
        <dd>{meta.counts.items}</dd>
        <dt>レシピ</dt>
        <dd>{meta.counts.recipes}</dd>
        <dt>建物</dt>
        <dd>{meta.counts.buildings}</dd>
        <dt>データ生成日時</dt>
        <dd>{meta.generatedAt}</dd>
      </dl>
    </main>
  )
}

export default App
