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
