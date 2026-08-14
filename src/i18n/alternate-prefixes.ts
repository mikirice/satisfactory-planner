import type { Locale } from './types.ts'

/**
 * 代替レシピ名の接頭辞（公式訳の実データから採取）。
 *
 * 表示コピーではなく、狭い一覧で名前を詰めるための**剥がす対象**（src/ui/format.ts）。
 * 各言語辞書にも同じ値を `alternateNamePrefix` として持たせてあり、この表と一致することを
 * tests/official-game-terms.test.ts が固定する（辞書側は翻訳者が1ファイルだけ見れば済むよう
 * リテラルのまま置く）。表を別に置く理由は2つ:
 *
 * 1. 語彙源はゲーム公式訳ひとつ（計画書 §8「訳語の不統一」）。ここは
 *    `src/data/names.<locale>.json` の代替レシピ名を数えて決めた値。
 * 2. 接頭辞の剥がしは**全言語ぶんを同時に**使う（英語で解決した名前を日本語表示のまま
 *    剥がせる必要がある）。辞書を遅延読み込みにしたあとも全言語ぶんが要るので、
 *    軽いこの表だけは常にバンドルする。
 *
 * フランス語だけは公式訳が接尾辞（「Lingot de fer pur (alternative)」）なので、
 * 接頭辞の剥がしは実質的に効かない。表記ゆれの1件だけが一致する。
 */
export const ALTERNATE_NAME_PREFIXES: Readonly<Record<Locale, string>> = {
  ja: '代替',
  en: 'Alternate',
  de: 'Alternativ',
  fr: 'Alternative',
  'es-ES': 'Alternativa',
  'pt-BR': 'Alternativa',
  ru: 'Альт.',
  'zh-Hans': '替代',
  'zh-Hant': '替代',
  ko: '대체',
  pl: 'Alternatywa',
  tr: 'Alternatif',
} as const
