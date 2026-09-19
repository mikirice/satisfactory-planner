/**
 * FAQ（トップ / と英語ランディング /en/）。
 *
 * 見える本文と FAQPage の構造化データは同じ定義から作るので、
 * ここでは「本当に両方に同じ質問が出ているか」を双方向で確かめる。
 * 生成後の実ファイル（/ と /en/）に対する検査は tests/build-pages.test.ts が担当する。
 */
import { describe, expect, it } from 'vitest'

import { faqEntries, faqPageSchema, renderFaqHtml } from '../scripts/static-pages/faq.ts'
import { STATIC_LOCALES } from '../scripts/static-pages/labels.ts'
import { escapeHtml, SITE_URL } from '../scripts/static-pages/templates.ts'

/** テンプレートの escapeHtml が入れた実体参照を戻す（本文と JSON-LD を素の文で比べるため）。 */
function unescapeHtml(value: string): string {
  return value
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}

/** FAQ ブロックに見えている質問（h3）。ページの他の h3（「主な機能」など）は拾わない。 */
function visibleQuestions(html: string): string[] {
  const block = html.match(/<div class="faq">([\s\S]*?)<\/div>/)
  expect(block, 'FAQ の本文が見つかりません').not.toBeNull()
  return [...block![1]!.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((match) => unescapeHtml(match[1]!))
}

type QuestionNode = { name: string; acceptedAnswer: { text: string } }

function questionsOf(schema: Record<string, unknown>): QuestionNode[] {
  return schema.mainEntity as QuestionNode[]
}

describe('FAQ の定義', () => {
  it.each(STATIC_LOCALES)('%s は5〜7問で、質問も回答も空でない', (locale) => {
    const entries = faqEntries(locale)
    expect(entries.length).toBeGreaterThanOrEqual(5)
    expect(entries.length).toBeLessThanOrEqual(7)
    expect(new Set(entries.map((entry) => entry.question)).size).toBe(entries.length)
    for (const entry of entries) {
      expect(entry.question.length).toBeGreaterThan(0)
      expect(entry.answer.length).toBeGreaterThan(0)
    }
  })

  it.each(STATIC_LOCALES)('%s の文面に未解決の名前トークンが残っていない', (locale) => {
    const text = faqEntries(locale)
      .map((entry) => `${entry.question}${entry.answer}`)
      .join('')
    expect(text).not.toMatch(/\{\{|\}\}/)
  })

  it.each(STATIC_LOCALES)('%s は本文と FAQPage が同じ質問・同じ回答を持つ', (locale) => {
    const entries = faqEntries(locale)
    const html = renderFaqHtml(locale)
    const schema = faqPageSchema(locale, `${SITE_URL}/`) as Record<string, unknown>

    // 本文 → 構造化データ
    const schemaQuestions = questionsOf(schema).map((node) => node.name)
    for (const question of visibleQuestions(html)) {
      expect(schemaQuestions).toContain(question)
    }
    // 構造化データ → 本文
    for (const node of questionsOf(schema)) {
      expect(html).toContain(`<h3>${escapeHtml(node.name)}</h3>`)
      expect(html).toContain(`<p>${escapeHtml(node.acceptedAnswer.text)}</p>`)
    }
    expect(visibleQuestions(html)).toEqual(entries.map((entry) => entry.question))
    expect(schemaQuestions).toEqual(entries.map((entry) => entry.question))
  })
})
