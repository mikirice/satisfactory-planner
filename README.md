# Satisfactory 生産計画ツール

日本語で使えて Excel が出てくる、軽量な Satisfactory 生産計画Webツール。
仕様は Obsidian `開発フォルダ/Satisfactory生産計画ツール/仕様書-v1.md` を正とする。

## 現在の状態

**Phase 1（プロジェクト基盤＋データパイプライン）完了。** UI は未実装（プレースホルダのみ）。

| Phase | 内容 | 状態 |
| --- | --- | --- |
| 1 | データパイプライン（Docs.json → 正規化JSON） | 完了 |
| 2 | 計算エンジン（LPソルバー選定＋実装） | 未着手 |
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
| `npm run build-data` | `data-source/*.json` → `src/data/{items,recipes,buildings,meta}.json` を生成 |
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
  types.ts            Item / Recipe / Building のスキーマ定義
  constants.ts        ゲーム係数（電力指数・液体1000倍単位など）を一元管理
  index.ts            アプリからの参照口（ID索引・レート換算）
  *.json              生成物（コミットする）
tests/                vitest
```

## データ仕様のポイント

- 液体・気体は Docs 内で 1000倍の内部単位。正規化時に 1/1000 して **m³** に統一済み。
  固体は個数のまま。レート換算は `amount * 60 / durationSec`
- アイテム名・レシピ名・建物名は `{ ja, en }` の両方を保持（日本語は公式ローカライズから取得、手訳なし）
- 対象は製造系レシピ＋生産系建物のみ。装飾・物流・車両などは除外（除外ルールは
  `scripts/build-data.ts` のコメント参照）
