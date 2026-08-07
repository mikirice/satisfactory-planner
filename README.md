# Satisfactory 生産計画ツール

日本語で使えて Excel が出てくる、軽量な Satisfactory 生産計画Webツール。
仕様は Obsidian `開発フォルダ/Satisfactory生産計画ツール/仕様書-v1.md` を正とする。

## 現在の状態

**Phase 4（Excel出力）完了。** ブラウザで目標を入力すると結果が読め、6シートの .xlsx が落とせる。

| Phase | 内容 | 状態 |
| --- | --- | --- |
| 1 | データパイプライン（Docs.json → 正規化JSON） | 完了 |
| 2 | 計算エンジン（LPソルバー選定＋実装） | 完了 |
| 3 | 結果テーブル | 完了 |
| 4 | Excel出力 | 完了 |
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
  extraction.ts       原料レート → 採掘機の台数・純度別ノード割当・採掘電力
src/plan/
  aggregate.ts        画面とExcelで共有する集計（建てる台数・機械種別グループ・建設コスト合成）
src/export/
  excel.ts            Excel(.xlsx)出力。6シートの組み立て・書式・ファイル名・ダウンロード
src/store/
  planner.ts          入力状態と解（zustand）。入力変更で200msデバウンス再計算
src/ui/
  text.ts             UI 文言（日本語）を集約
  format.ts           数値フォーマット（レート小数2位・台数小数4位）
  Sidebar.tsx         入力（目標 / 目的関数 / 採掘設備 / 代替レシピ / 原料上限 / 物流 / Excel出力）
  ResultView.tsx      結果タブ（サマリー / 生産ステップ / 原料 / アイテム収支）
  ExportPanel.tsx     プラン名の入力とExcelダウンロード（exceljsはクリック時に動的import）
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
- 採掘側（採掘機の台数・純度別ノード・採掘電力）は `planExtraction(solution)`。
  既定は採鉱機 Mk.3・クロック100%で、純度の高いノードから埋める。端数の1台だけ
  アンダークロック扱いで電力を計算する（資源井戸は加圧機の台数を平均サテライト数から概算）

## 画面（Phase 3）

`npm run dev` で起動。左が入力、右が結果タブ。

- 入力: 目標産出（日本語名のインクリメンタル検索）/ 目的関数プリセット（資源効率・電力最小・
  建物最小）/ 固体ノードの採掘機 Mk / 代替レシピの一括＋個別ON・OFF / 原料上限の上書き /
  搬送手段（ベルト・パイプの Mk）/ プラン名と Excel ダウンロード
- 結果: サマリー（総電力の幅表示＋製造・採掘の内訳、建物数、建設コスト、シンクポイント、副産物）/
  生産ステップ（機械種別グルーピング・クロック案）/ 原料（上限比率・採掘機台数・純度別ノード）/
  アイテム収支（余剰・不足を色とラベルの両方で表示）
- 解けないときは Phase 2 の診断結果（不足している原料と量）を日本語で表示する

## Excel出力（Phase 4）

サイドバー下部の「Excelダウンロード」で、現在の解を `.xlsx` に書き出す（`src/export/excel.ts`）。
ファイル名は `satisfactory-plan_<プラン名>_<YYYYMMDD>.xlsx`（プラン名未入力なら `plan`）。

| シート | 内容 |
| --- | --- |
| サマリー | プラン名・目標産出・電力（製造/採掘/合計）・建物数・必要原料・シンクポイント・副産物・有効な代替レシピ |
| 建物リスト | 機械種別ごとのレシピ・稼働台数・建てる台数・クロック・電力・投入/産出 |
| アイテム収支 | 産出/消費/外部供給/差分。不足=赤系・余剰=青系の塗り＋状態ラベル |
| 原料 | 必要レート・マップ上限比率・採掘設備の台数・純度別のノード割当・採掘電力 |
| 建設コスト | 製造建物と採掘設備の建材合計 |
| 物流 | 各フローのベルト/パイプ換算（選択中の Mk での必要本数・使用率） |

- サマリー以外はヘッダー行を固定＋オートフィルタ付き。列幅は内容に合わせて自動調整
- **数値は必ず数値セル**（レート・電力は小数2位、稼働台数は小数4位の表示形式）。
  合計行はフィルタで隠れないようフィルタ範囲の外に置く
- 生成は Node / ブラウザ共通。保存部分だけ環境で分岐する（テストは `tests/excel.test.ts` で
  書き出した .xlsx を読み戻して検証している）
- exceljs はバンドルが重いのでダウンロード時に動的 import する（初期表示には載らない）

## データ仕様のポイント

- 液体・気体は Docs 内で 1000倍の内部単位。正規化時に 1/1000 して **m³** に統一済み。
  固体は個数のまま。レート換算は `amount * 60 / durationSec`
- アイテム名・レシピ名・建物名は `{ ja, en }` の両方を保持（日本語は公式ローカライズから取得、手訳なし）。
  ただし**公式 ja ローカライズ自体が未訳**のものだけは `scripts/build-data.ts` の
  `JA_NAME_OVERRIDES` で補い、`meta.untranslatedJaNames` に記録する
  （1.1.x では `Recipe_Alternate_PolyesterFabric_C` の1件のみ）
- 対象は製造系レシピ＋生産系建物のみ。装飾・車両などは除外（除外ルールは
  `scripts/build-data.ts` のコメント参照）
- 採掘・抽出はレシピとして定義されていないため、建物の `mItemsPerCycle` /
  `mExtractCycleTime` から `extractors.json` を組み立てている（純度倍率は `constants.ts`）
- ベルト/パイプの速度は `logistics.json`（`mSpeed` は 1/2、`mFlowLimit` は ×60 で実効値）
- マップの資源ノード数・最大採取レートだけは Docs に無いので `src/data/map-limits.ts` に
  Wiki の値を手写ししてある。ノード数から最大レートを再計算して一致することをテストで担保
