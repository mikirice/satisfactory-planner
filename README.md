# Satisfactory 生産計画ツール

日本語で使えて Excel が出てくる、軽量な Satisfactory 生産計画Webツール。
仕様は Obsidian `開発フォルダ/Satisfactory生産計画ツール/仕様書-v1.md` を正とする。

## 現在の状態

**Phase 2（LP計算エンジン）完了。** UI は未実装（プレースホルダのみ）。

| Phase | 内容 | 状態 |
| --- | --- | --- |
| 1 | データパイプライン（Docs.json → 正規化JSON） | 完了 |
| 2 | 計算エンジン（LPソルバー選定＋実装） | 完了 |
| 3 | 結果テーブル | 未着手 |
| 4 | Excel出力 | 未着手 |
| 5 | 閲覧専用グラフ | 未着手 |

## セットアップ

```sh
npm install
npm run build-data   # 初回は data-source/ の Docs を自動ダウンロードして正規化JSONを生成
```

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run fetch-docs` | 公式 Docs のミラーを `data-source/` に取得（`-- --force` で再取得） |
| `npm run build-data` | `data-source/*.json` → `src/data/{items,recipes,buildings,extractors,logistics,meta}.json` を生成 |
| `npm test` | vitest（スキーマ整合性・既知値・日本語名の検証） |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run dev` | Vite 開発サーバ |
| `npm run build` | 型チェック＋本番ビルド |

ゲームがアップデートされたら `npm run fetch-docs -- --force && npm run build-data && npm test` の
3手でデータを更新できる（データソースの記録は `data-source/DATA_SOURCES.md`）。

## 構成

```
data-source/          Docs.json のミラー（gitignore。DATA_SOURCES.md だけコミット）
scripts/
  fetch-docs.ts       Docs のダウンロード
  docs-parse.ts       エンコーディング判定・Unreal文字列パース（単体テスト対象）
  build-data.ts       正規化パイプライン本体
src/data/
  types.ts            Item / Recipe / Building / Extractor / Belt / Pipe のスキーマ定義
  constants.ts        ゲーム係数（電力指数・純度倍率・液体1000倍単位など）を一元管理
  map-limits.ts       マップの資源ノード数と最大採取レート（Docsに無いので手写し＋出典）
  index.ts            アプリからの参照口（ID索引・レート換算）
  *.json              生成物（コミットする）
src/solver/
  types.ts            SolveInput / Solution（v0 §4.2・§4.4）
  lp.ts               ソルバー非依存のLPモデル表現＋CPLEX LP書き出し
  glpk-backend.ts     glpk.js(WASM) バックエンド。Node/ブラウザ両対応
  model.ts            レシピ集合 → LPモデルの組み立て
  solve.ts            求解と Solution の組み立て・実行不能診断
  overclock.ts        オーバークロック / Somersloop の後処理
  logistics.ts        ベルト・パイプの本数換算
docs/
  solver-benchmark.md ソルバー選定の記録（glpk.js vs highs-js）
  bench/              ベンチ用スクリプト（tsconfig の対象外）
tests/                vitest
```

## 計算エンジンの使い方

```ts
import { solveProduction } from './src/solver/index.ts'

const result = await solveProduction({
  targets: [{ item: 'Desc_IronPlate_C', ratePerMin: 60 }],
  // enabledRecipes 省略 = 代替レシピを除く全レシピ
  // resourceLimits 省略 = マップ上限（map-limits.ts）
})
if (result.status === 'optimal') {
  result.steps        // レシピ別の台数・電力・入出力レート
  result.rawResources // 原料の使用量と上限比率
  result.byproducts   // 余剰（副産物）
} else {
  result.reasons      // 実行不能の原因（不足している原料・作れないアイテム）
}
```

- **循環レシピ（リサイクル・プラスチック/ゴム）を正しく解ける。** 副産物の再利用も
  収支制約で自動的に相殺されるので二重計上しない
- 目的関数は「原料 / 電力 / 台数」の加重和。`weights` で切り替える
- 原料の相対コストの既定は `'scarcity'`（マップ上限が少ない資源ほど高コスト）。
  一律だと「変換機で硫黄から石灰岩を作る」ような解が出るため
- 稼働台数は連続値。整数台＋クロックへの割り当ては `planClocks()` が後処理で出す

## データ仕様のポイント

- 液体・気体は Docs 内で 1000倍の内部単位。正規化時に 1/1000 して **m³** に統一済み。
  固体は個数のまま。レート換算は `amount * 60 / durationSec`
- アイテム名・レシピ名・建物名は `{ ja, en }` の両方を保持（日本語は公式ローカライズから取得、手訳なし）
- 対象は製造系レシピ＋生産系建物のみ。装飾・車両などは除外（除外ルールは
  `scripts/build-data.ts` のコメント参照）
- 採掘・抽出はレシピとして定義されていないため、建物の `mItemsPerCycle` /
  `mExtractCycleTime` から `extractors.json` を組み立てている（純度倍率は `constants.ts`）
- ベルト/パイプの速度は `logistics.json`（`mSpeed` は 1/2、`mFlowLimit` は ×60 で実効値）
- マップの資源ノード数・最大採取レートだけは Docs に無いので `src/data/map-limits.ts` に
  Wiki の値を手写ししてある。ノード数から最大レートを再計算して一致することをテストで担保
