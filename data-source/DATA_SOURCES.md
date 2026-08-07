# データソース記録

正規化JSON（`src/data/*.json`）の元になっている生データの入手元と素性。
ゲームアップデート時はここを更新してから `npm run fetch-docs -- --force && npm run build-data` する。

## 入手元

- 取得日: 2026-08-07
- ミラー元リポジトリ: <https://github.com/aringadre76/satisfactory-api>（MIT / `Docs/` 配下にゲーム同梱 Docs をそのまま配置）
- 直リンク（`scripts/fetch-docs.ts` の `SOURCE_BASE_URL`）:
  <https://raw.githubusercontent.com/aringadre76/satisfactory-api/master/Docs>
- オリジナルの所在: ゲームインストール先の `Satisfactory/CommunityResources/Docs/`
  （Coffee Stain Studios がコミュニティ向けに公式同梱しているファイル。ミラーは無改変のコピー）

## 取得ファイル

| ファイル | 用途 | サイズ | エンコーディング |
| --- | --- | --- | --- |
| `en-US.json` | 原文（構造・数値の正） | 10,072,572 bytes | UTF-16LE + BOM / CRLF |
| `ja.json` | 日本語表示名の取得元 | 9,907,448 bytes | UTF-16LE + BOM / CRLF |
| `CustomVersions.json` | バージョン特定の補助 | 18,164 bytes | UTF-16LE + BOM |

これらは容量が大きく、かつゲームデータの再配布を避けるため **リポジトリにはコミットしない**
（`.gitignore` 済み）。`npm run fetch-docs` または `npm run build-data` で自動取得される。

## ゲームバージョン

**Satisfactory 1.1.x**（1.0 以降であることが要件。判定は以下の実証による）

- `CustomVersions.json` の `Release` custom version = 44
- NativeClass のフィンガープリント照合（`satisfactory-dev/Docs.json.ts` の
  `schema/{version}/base-classes.json` と突き合わせ）:
  - `FGBuildableElevator` / `FGBuildableConveyorMonitor` を含む → 1.0.1.4 ではない（1.1 で追加）
  - `FGBuildableStair` / `FGVehiclePathSegment` を含まない → 1.2.0.0 ではない
- 1.0 以降の要素（`FGBuildablePortal`, `FGBuildablePowerBooster`, `FGCentralStorageContainer`,
  `Build_QuantumEncoder_C`, `Build_Converter_C`）が存在することも確認済み

ミラー元リポジトリがパッチバージョン（1.1.0 / 1.1.1 / 1.1.2）まで明記していないため、
`1.1.x` 止まりで記録している。厳密なビルド番号が必要になったら、オーナーのゲーム実物の
`CommunityResources/Docs/` と差し替えて確認する。

## 日本語名の取得方法（実態）

1.0 以降の Docs は **言語ごとにファイルが分かれている**構成で、多言語構造が
1ファイルに入っているわけではない。`ja.json` は `en-US.json` と同一の
`NativeClass` / `ClassName` 構造を持ち、`mDisplayName` や `mDescription` だけが翻訳されている。

したがって `build-data.ts` は `ja.json` から `ClassName → mDisplayName` のマップを作り、
`en-US.json` 側のエンティティに突き合わせている（手訳は一切しない）。

- ファイル名は `ja-JP.json` ではなく **`ja.json`**（v0仕様書の記載と差異あり）
- 実際に取得できた例: `Desc_IronPlate_C` → 鉄板 / `Build_ConstructorMk1_C` → 製作機
- 2026-08-07 時点の生成では **ja 名のフォールバックは 0 件**（`src/data/meta.json` の
  `missingJaNames` が空であることをテストで担保）

なお、ミラーには他に 30 以上の言語ファイル（`de.json`, `zh-Hans.json` 等）が存在する。
Phase 6 で en 以外の i18n が必要になったら同じ仕組みで追加できる。

## 権利について

Docs のデータは Coffee Stain Studios の著作物。本ツールは非商用のファンツールとして
計算目的でのみ利用する。アイコン画像などのゲームアセットは同梱しない
（`Item.icon` はアセット名の文字列のみ）。
