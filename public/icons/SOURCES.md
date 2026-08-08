# アイコン画像の出典と撤去手順

このフォルダの PNG は **ゲーム内アイコン（Satisfactory）** です。
`scripts/fetch-icons.ts`（`npm run fetch-icons`）が自動取得したもので、手作業の加工はしていません。

## 入手元

- 取得日: 2026-08-08
- 入手元: 公式 Wiki <https://satisfactory.wiki.gg/>（wiki.gg・MediaWiki API 経由）
  - API: `https://satisfactory.wiki.gg/api.php?action=query&prop=imageinfo&iiurlwidth=64&titles=File:<英語名>.png`
  - Wiki 上のライセンス表記は「Coffee Stain Studios が権利を持つゲーム由来の素材」
    （`{{License/first-party}}`）
- 解像度: 幅 64px のサムネイル（元は 256 / 512px）
- ファイル名: **Docs.json の ClassName**（例 `Desc_IronPlate_C.png` / `Build_ConstructorMk1_C.png`）
  - Wiki 側のファイル名は英語表示名なので、`src/data/items.json` / `buildings.json` の
    `name.en` から `File:<Name>.png` を組み立てて解決している
- 収録数: 218 / 221 件・合計 1.43 MB

### アイテム/建物以外の追加アイコン（画面の記号として使う）

- `Desc_HardDrive_C.png`（ハードドライブ / Hard Drive）… 代替レシピの目印

Docs.json に生産物としてのエントリが無いので `src/data/icons.json` には載せていない
（解決は `src/ui/icons.ts` の EXTRA_ICON_IDS 側）。撤去手順は下と同じで、消えても画面は文字だけに戻る。

### 採用しなかったもの（アイコン無し＝画面では文字だけ表示）

Wiki 側に**アイコンではない画像**しか無いものは取り込んでいない。判定は自動:

- `File:Unknown item FP.png` / `File:Unknown building FP.png` へのリダイレクト
  （未公開アイテムの「？」画像）
- 正方形でない PNG（アイコンではなくスクリーンショットが同名で置かれている場合）

- `Desc_SAMFluctuator_C`（SAM 変動機 / SAM Fluctuator）
- `Build_Converter_C`（変換機 / Converter）
- `Build_QuantumEncoder_C`（量子エンコーダー / Quantum Encoder）

## 権利について（グレーであることの明示）

アイコンの著作権は **Coffee Stain Studios** にあります。本ツールは非商用の個人向けファンツールで、
生産計画の可読性のために引用的に表示しているだけですが、**ゲームアセットの再配布は
公式に許諾されたものではありません**（同種のファンツールでは長年慣行的に使われている、というのが
現状の判断根拠）。権利者から要請があれば**即座に全削除**します。

## 撤去手順（1分で終わる・アプリは壊れない）

```sh
rm -rf public/icons
echo '[]' > src/data/icons.json
npm run build
```

- `src/ui/icons.ts` の `iconPath()` が `null` を返すようになり、画面は**元のテキスト表示に戻る**
- 画像だけ消して `src/data/icons.json` を戻し忘れても、`<img>` の `onError` で
  そのアイコンだけ消える（レイアウトは崩れるが動作は継続する）
- アイコンを参照しているのは `src/ui/ItemIcon.tsx` / `src/ui/icons.ts` の2ファイルだけ

## 再取得

```sh
npm run fetch-icons           # 無いものだけ
npm run fetch-icons -- --force  # 全部取り直す
```
