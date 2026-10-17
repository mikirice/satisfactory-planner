# 既存Satisfactory記事23テーマの一次監査 (2026-10-17)

## 範囲と結論

- 公開済みMotor追加前の23テーマ（日英で46ページ）を対象に、登録・生成経路、Planner内の現行表示/操作、ゲームデータの出所・対象版、ソルバー生成の数値か手書きの数値か、テンプレート/CTAを確認した。
- 公式サイトはSatisfactory Update 1.2を2026-06-02公開と掲示している。Plannerの `src/data/meta.json` と `data-source/DATA_SOURCES.md` は引き続き1.1.xのデータを指定する。1.2のレシピ・建物値を実機/一次ゲームデータで再照合できていないため、値やゲームデータ自体は変更しない。
- 23テーマすべての日英ページに、収録データが1.1.xでUpdate 1.2未照合であること、現行ゲーム内数値を優先すること、公式Updateへのリンクを表示する修正を行った。手書きチュートリアルには別の表示不整合も見つかったため、5タブ→実装どおり6タブへ訂正し、Build listの用途を追記した。
- Motor記事を含む24テーマ全日英ページに対する新しい回帰テストを追加した。ゲームデータ、採掘/レシピ定数、サンプルプランは変更していない。

## テーマ別確認記録

| # | 日英共通slug / テーマ | 確認した主な点 | 結果・改訂 |
|---:|---|---|---|
| 1 | `production-planning-tutorial` 生産計画入門 | ResultViewの結果タブと手順、CTA | 実装は6タブ。本文の「5タブ」を訂正しBuild listを追加。1.1.x注意書きを追加。 |
| 2 | `alternate-recipe-metrics` 代替レシピの比較指標 | 出力/機械・MW・材料比率の定義、数値根拠 | 指標の切り分けを維持。例は1.1.xに限定する注意書きを追加。 |
| 3 | `power-generation-planning` 発電計画 | 目標MW/工場消費電力の説明とサンプル設定 | 現行ソルバー由来の例と1.1.xデータの境界を明記。 |
| 4 | `somersloop-and-power-shards` Somersloopとシャード | 生産/電力倍率、設定値 | 係数を未検証で改変せず、版差を明示。 |
| 5 | `excel-export-guide` Excel出力 | ワークブックの構成、収支/物流説明 | 機能説明を維持し、生成データ版を明示。 |
| 6 | `coal-power-startup` 石炭発電 | 発電機の燃料・水、ベルト/採掘例、プランナー出力 | 数字は1.1.x由来として扱い、版差を明示。 |
| 7 | `oil-products-basics` 石油製品 | 原油/残留重油/燃料/副産物の比率 | 比較値を未検証で変更せず、版差を明示。 |
| 8 | `aluminum-production-guide` アルミニウム | アルミナ溶液・水・シリカの例、関連ループ | 数字は1.1.x由来として版差を明示。 |
| 9 | `awesome-sink-points` AWESOMEシンク | シンク可能な固体の範囲、材料/産物の比率 | データ集計の範囲を維持し、版差を明示。 |
| 10 | `clock-and-efficiency` クロック効率 | クロック指数、段階割当、シャード/Somersloop | 値を未検証で更新せず、版差を明示。 |
| 11 | `build-checklist-guide` 建設リスト | 台数・搬送帯域・依存順の現行UI | 建設リストは参照用で操作チェックではない説明を維持、版差を明示。 |
| 12 | `strong-alternate-recipes` 強い代替レシピ | 代替間の材料・建物・電力 trade-off | 例は1.1.xのデータ比較として版差を明示。 |
| 13 | `miner-rate-by-purity` 採掘レート | 純度/採掘機/クロック/ベルト例、対象版表記 | 既存の1.1.x限定記述に加え、1.2未照合の注意を前段で表示。 |
| 14 | `oil-loop-complete` 完全石油リサイクル | ループ循環、水/燃料ソルバー値、起動順 | ループの起動・背圧注意とデータ版の境界を明示。 |
| 15 | `diluted-fuel-power` 希釈燃料発電 | 残留重油→希釈燃料→発電の計算 | ソルバー値を1.1.xとして表示し、版差を明示。 |
| 16 | `turbofuel-power` ターボ燃料発電 | SAM/硫黄/圧縮石炭/燃料の経路 | 既知のテンプレートを維持し、版差を明示。 |
| 17 | `aluminum-water-loop` アルミ水ループ | 副産物水の循環と初動 | steady-state説明の範囲を維持し、版差を明示。 |
| 18 | `packaged-diluted-fuel-loop` 包装希釈燃料 | 空キャニスターの初期投入/循環 | 初動条件を保ち、版差を明示。 |
| 19 | `battery-water-loop` バッテリー水ループ | 返却水・アルミ上流の循環量 | build-timeソルバー値の版差を明示。 |
| 20 | `nuclear-simplified` 簡略原子力 | 代替レシピ、SAM制約、廃棄物 | 排出/保存説明を維持し、版差を明示。 |
| 21 | `nuclear-uranium` ウラン発電 | 発電量・燃料/廃棄物・安全装備 | ソルバー構成を維持し、版差を明示。 |
| 22 | `nuclear-plutonium` プルトニウム再処理 | 最低目標と全台出力の差、廃棄物 | 比較と目標意味を維持し、版差を明示。 |
| 23 | `nuclear-reprocessing` フィッコニウム循環 | 三段階燃料、廃棄物循環、steady-state限界 | 初動・流体の制約説明を維持し、版差を明示。 |

## 根拠・検証

- Official Satisfactory homepage: https://www.satisfactorygame.com/ — 現行ページはUpdate 1.2を2026-06-02公開と掲示。
- ゲームデータの取得元・判定・対象版: [`DATA_SOURCES.md`](../../data-source/DATA_SOURCES.md)、`src/data/meta.json`。この一次監査で1.2データを取り込んだり1.1.x値を更新したりしていない。
- 6タブの直接実装根拠: `src/ui/ResultView.tsx` の `TABS = ['summary','steps','resources','balance','flow','build']`。新テストは日英24テーマ各ページに版差通知とUpdate 1.2リンクがあること、チュートリアルに6タブ/Build listが含まれることを検証。
- 実行結果: `npm run test` 42 files / 904 passed; `npm run build` success（24記事×2 locale、198 item pages/locale、455 sitemap URL）; `npm run lint` exit 0（既存warnings）; `git diff --check` clean。

## 次の編集ゲート

このレポートは一次監査と既知の改訂を記録する。Update 1.2の数値を記事本文へ反映するには、公式ゲームデータを合法・安全な方法で取得し、変更差分を照合してから行う。UI操作画面や1.2での初動/搬送挙動は別途実ゲーム/公式資料で検証する。現行改訂のリリース後は、ライブ記事リスト・日英切替・通知表示を実際の配信経路で再確認する。
