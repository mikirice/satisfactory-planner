# LPソルバー選定ベンチ: glpk.js vs highs-js

仕様書 v1 §4 で「Phase 2冒頭で `glpk.js` と `highs-js` を同一定式化でベンチして選定」と
決めていたもの。**結論: `glpk.js` (GLPK 5.0 / WASM) を採用した。**

- 計測日: 2026-08-07
- 環境: macOS (Darwin 25.3.0) / Node v25.9.0 / Apple Silicon
- 比較対象: `glpk.js@5.0.0` (GPL-3.0) / `highs@1.15.2` = highs-js (MIT)
- 再現手順: `npm i --no-save highs@1 && npx tsx docs/bench/solver-bench.ts && npm uninstall highs`
- 定式化は両者とも `src/solver/model.ts` が組み立てた同一の `LpModel`
  （HiGHS へは CPLEX LP フォーマット文字列、GLPK へは JS オブジェクト経由）

## 結論

`glpk.js` が **数値精度・配布サイズ・速度の3点すべてで上回った**ため採用。
唯一 highs-js が有利なのはライセンス（MIT）で、ここは NEEDS-REVIEW（後述）。

| 観点 | glpk.js | highs-js | 判定 |
| --- | --- | --- | --- |
| 数値精度 | IEEE754 double をそのまま返す | **有効数字6桁**（`3.33333`） | glpk |
| 配布サイズ（brotli） | 145KB（wasm埋め込み1ファイル） | 823KB（js 17KB + wasm 806KB） | glpk |
| 解の求解時間（中央値） | 0.53〜1.03ms | 2.12〜3.07ms | glpk |
| 初期化 | 11.4ms | 19.4ms | glpk |
| ブラウザ対応 | Web Worker 版が自己完結（wasm埋め込み） | wasm を別アセットとして配信する必要あり | glpk |
| 最適値の一致 | — | — | **完全一致（相対差 ≤ 4e-15）** |
| ライセンス | GPL-3.0 | MIT | highs |

### 決め手1: 数値精度（最重要）

highs-js は WASM 側の `Highs_writeSolutionPretty` が書いた**テキストをパースして**解を返す実装。
`%g` 相当の書式なので**有効数字6桁で打ち切られる**。

```
10/3 を返させたとき
  highs-js : 3.33333               ← 相対誤差 ~1e-6
  glpk.js  : 3.3333333333333335    ← 正確
```

この誤差は解そのものではなく JS ラッパーの出力段で生じるため、こちら側では直せない
（`write_solution_style` オプションは `writeSolutionPretty` には効かず、emscripten の FS も公開されていない）。

実害として、リサイクル・プラスチックの循環を含むプランで
「燃料 産出100 / 消費99.9999」のような収支のズレが出て、
**アイテム収支が閉じず、幻の副産物が 0.0001/min 単位で並ぶ**。
本ツールは「正しい数字」と Excel 出力が売りなので、ここは譲れないと判断した。

### 決め手2: 配布サイズ

看板が「軽量」なので効く。
`highs.wasm` は brotli 後でも 806KB あり、しかも**別アセットとして配信して `locateFile` で
URL を教える**必要がある。glpk.js のブラウザ版は wasm を deflate 圧縮して JS に埋め込んだ
単一ファイル（205KB / brotli 145KB）で、Web Worker まで自前で立てる。
Vite の設定を一切いじらずに動的 import だけでバンドルできた。

### 決め手3: 速度

全291レシピを変数に入れた中〜大規模ケースで 2.5〜5倍速い。
絶対値はどちらも「体感ゼロ」の領域なので優先度は低いが、
UI から重み違いの解を複数出す場合には効いてくる。

## 計測結果（生データ）

### 配布サイズ

```
- highs.wasm : raw 3351KB / gzip 1155KB / brotli 806KB
- highs.js   : raw   68KB / gzip   20KB / brotli  17KB
- glpk.wasm  : raw  287KB / gzip  124KB / brotli 105KB   （Node版・別ファイル）
- glpk.js    : raw   43KB / gzip   15KB / brotli  13KB   （Node版ローダ）
- glpk index : raw  205KB / gzip  148KB / brotli 145KB   （ブラウザ版・wasm埋め込み単一ファイル）
```

### 初期化

```
highs 19.4ms / glpk 11.4ms
```

### ケース別（時間は20回試行の中央値）

```
### 小: 鉄板 60/min（基本レシピのみ・66レシピ）
  変数 193 / 制約 166 / LPテキスト 10.1KB
  status  highs=Optimal glpk=Optimal
  目的関数 highs=90.000006 glpk=90.000006 (相対差 0.00e+0)
  変数の最大相対差 0.00e+0
  時間(中央値) highs=2.62ms glpk=0.54ms

### 中: モジュール式エンジン 10/min（全291レシピ）
  変数 304 / 制約 168 / LPテキスト 15.6KB
  status  highs=Optimal glpk=Optimal
  目的関数 highs=613.1339652753168 glpk=613.1339652753172 (相対差 7.42e-16)
  変数の最大相対差 4.27e-6 @ s:Desc_SAM_C
  時間(中央値) highs=3.07ms glpk=0.81ms

### 中: ターボモーター 10/min（全291レシピ）
  変数 304 / 制約 168 / LPテキスト 15.6KB
  status  highs=Optimal glpk=Optimal
  目的関数 highs=2613.682314535901 glpk=2613.682314535911 (相対差 3.83e-15)
  変数の最大相対差 2.76e-6 @ s:Desc_Sulfur_C
  時間(中央値) highs=2.93ms glpk=1.01ms

### 大: ニュークリアパスタ 1/min + ターボモーター 20/min（全291レシピ）
  status  highs=Optimal glpk=Optimal
  目的関数 highs=6249.848026689778 glpk=6249.848026689805 (相対差 4.37e-15)
  変数の最大相対差 3.22e-6 @ x:Recipe_Alternate_ElectroAluminumScrap_C
  時間(中央値) highs=2.64ms glpk=1.02ms

### 循環: プラスチック 300/min（リサイクル系込み・全291レシピ）
  status  highs=Optimal glpk=Optimal
  目的関数 highs=281.250018125 glpk=281.25001812499994 (相対差 2.02e-16)
  変数の最大相対差 3.55e-16 @ x:Recipe_Alternate_Plastic_1_C
  時間(中央値) highs=2.12ms glpk=0.54ms

### 巨大: 全291レシピ + 目標6種同時
  status  highs=Optimal glpk=Optimal
  目的関数 highs=10015.8025523963 glpk=10015.802552396299 (相対差 1.82e-16)
  変数の最大相対差 3.46e-6 @ x:Recipe_Alternate_RubberConcrete_C
  時間(中央値) highs=2.58ms glpk=1.03ms

## 数値精度（10/3 = 3.3333333333333335 が返るか）
  highs a = 3.33333
  glpk  a = 3.3333333333333335
```

**解の一致**: 全ケースで最適値が相対差 1e-14 未満で一致した（変数レベルの差 3e-6 は
すべて highs-js の出力桁落ちに由来。循環レシピのケースでは変数まで 3.55e-16 で一致）。
「どちらのソルバーでも同じ最適解に到達する」ことは確認済みで、
定式化そのものにソルバー依存の曖昧さはない。

## NEEDS-REVIEW: ライセンス

**glpk.js は GPL-3.0。** 静的Webアプリに組み込んで配布すると、
アプリ全体を GPL-3.0 互換ライセンスで公開する義務が生じる。

採用を選んだ理由:
- 本プロジェクトは仕様書 v1 §1 で **「非商用ファンツール。収益化はしない」** と明記されている
- 公開時にソースを GPL-3.0 で出すこと自体は目的と矛盾しない

ただし**ライセンスの決定はオーナーの判断事項**なので、公開前に確認が必要。
もし MIT / クローズドで配布したくなった場合は、`src/solver/lp.ts` の `LpBackend`
インターフェースを実装した `highs-backend.ts` を1ファイル追加して
`solve.ts` の既定バックエンドを差し替えるだけで戻せる（モデル組み立て側は無変更）。
その際は上記の 6桁精度問題を、`writeLpFormat` の出力を使った外部検算などで
別途カバーする必要がある。

## 実装上のメモ

- `presol: true` は速いが、解けなかったときのステータスが常に `GLP_UNDEF` になり
  「実行不能」と「非有界」を区別できない。`solveWithGlpk` は最適解が出なかったときだけ
  `presol: false` で解き直して正確なステータスを取っている（遅い経路は失敗時のみ）
- ブラウザ版は Blob URL から Web Worker を起動する。**厳しい CSP 下では
  `worker-src blob:` の許可が要る**（Phase 3 でデプロイ先を決めるときに確認すること）
- `writeLpFormat`（CPLEX LP 出力）は採用後も残してある。同じ問題を外部ソルバーに
  食わせて突き合わせるデバッグ手段として有用なため
