import type { Locale } from './types.ts'

/**
 * 言語スイッチャーに出す各言語の**自称表記**（endonym）。
 *
 * 「Deutsch」は何語で表示していても Deutsch なので、辞書に12言語ぶん×12回書くと
 * 重複と表記ゆれの温床になる。ここ1か所に置き、辞書には翻訳が必要なラベル
 * （`language.label`＝「言語」/「Sprache」…）だけを残す。
 * 中国語は簡体・繁体それぞれの字体で書く（計画書 §8 の取り違え対策）。
 */
export const LOCALE_ENDONYMS: Readonly<Record<Locale, string>> = {
  ja: '日本語',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  'es-ES': 'Español',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
  ko: '한국어',
  pl: 'Polski',
  tr: 'Türkçe',
} as const

/**
 * 言語スイッチャーに添える国旗（Regional Indicator の組み合わせ）。
 *
 * 言語と国は本来 1:1 ではないが、スイッチャーは**目印**として国旗を出す方が
 * 一覧から自分の言語を素早く見つけられる（オーナー指示）。割当は代表的な
 * 話者地域に寄せ、中国語は簡体=CN・繁体=TW で字体と揃える。
 * 読み上げには意味がないので、装飾が不要な箇所（aria-label 等）では
 * LOCALE_ENDONYMS 側の素の表記を使う。
 */
export const LOCALE_FLAGS: Readonly<Record<Locale, string>> = {
  ja: '🇯🇵',
  en: '🇺🇸',
  de: '🇩🇪',
  fr: '🇫🇷',
  'es-ES': '🇪🇸',
  'pt-BR': '🇧🇷',
  ru: '🇷🇺',
  'zh-Hans': '🇨🇳',
  'zh-Hant': '🇹🇼',
  ko: '🇰🇷',
  pl: '🇵🇱',
  tr: '🇹🇷',
} as const

/** 言語スイッチャーの表示文字列（国旗＋自称表記）。表示側で結合をばらけさせない。 */
export function localeSwitcherLabel(locale: Locale): string {
  return `${LOCALE_FLAGS[locale]} ${LOCALE_ENDONYMS[locale]}`
}
