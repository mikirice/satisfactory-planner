import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { beforeAll, describe, expect, it } from 'vitest'

import {
  HARDCODED_JAPANESE_ALLOWLIST,
  type HardcodedJapaneseAllowlistEntry,
} from './hardcoded-japanese-allowlist.ts'

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))
const SCAN_ROOTS = ['src/ui', 'src/export'] as const
const JAPANESE_CHARACTER = /[々〆〇〻぀-ヿ㐀-鿿ｦ-ﾟ]/

type Finding = Readonly<{
  file: string
  line: number
  column: number
  kind: string
  sourceText: string
}>

type Audit = Readonly<{
  unallowlisted: readonly Finding[]
  unusedAllowlist: readonly HardcodedJapaneseAllowlistEntry[]
  multiplyMatchedAllowlist: readonly HardcodedJapaneseAllowlistEntry[]
}>

let audit: Audit

beforeAll(async () => {
  audit = await auditHardcodedJapanese()
})

describe('hardcoded Japanese UI source guard', () => {
  it('keeps every allowlist entry justified, unique, and in use', () => {
    const missingJustification = HARDCODED_JAPANESE_ALLOWLIST.filter(
      (entry) => entry.justification.trim() === '',
    )
    const keys = HARDCODED_JAPANESE_ALLOWLIST.map(allowlistKey)
    const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index)

    expect(missingJustification, 'Allowlist entries require a justification').toEqual([])
    expect(duplicateKeys, 'Allowlist entries must be unique').toEqual([])
    expect(
      audit.multiplyMatchedAllowlist,
      `Each allowlist entry must match exactly one AST node:\n${formatAllowlist(
        audit.multiplyMatchedAllowlist,
      )}`,
    ).toEqual([])
    expect(
      audit.unusedAllowlist,
      `Remove stale allowlist entries:\n${formatAllowlist(audit.unusedAllowlist)}`,
    ).toEqual([])
  })

  it('has 0 unallowlisted Japanese literals in src/ui and src/export', () => {
    expect(
      audit.unallowlisted,
      `Found ${audit.unallowlisted.length} hardcoded Japanese literal(s):\n${formatFindings(
        audit.unallowlisted,
      )}`,
    ).toHaveLength(0)
  })
})

async function auditHardcodedJapanese(): Promise<Audit> {
  const files = (
    await Promise.all(SCAN_ROOTS.map((root) => typescriptFiles(join(PROJECT_ROOT, root))))
  )
    .flat()
    .sort()

  const findings = (
    await Promise.all(files.map((file) => findingsInFile(file)))
  ).flat()
  const allowedKeys = new Set(HARDCODED_JAPANESE_ALLOWLIST.map(allowlistKey))
  const findingCountByKey = new Map<string, number>()
  for (const finding of findings) {
    const key = findingKey(finding)
    findingCountByKey.set(key, (findingCountByKey.get(key) ?? 0) + 1)
  }

  return {
    unallowlisted: findings.filter((finding) => !allowedKeys.has(findingKey(finding))),
    unusedAllowlist: HARDCODED_JAPANESE_ALLOWLIST.filter(
      (entry) => !findingCountByKey.has(allowlistKey(entry)),
    ),
    multiplyMatchedAllowlist: HARDCODED_JAPANESE_ALLOWLIST.filter(
      (entry) => (findingCountByKey.get(allowlistKey(entry)) ?? 0) > 1,
    ),
  }
}

async function typescriptFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await typescriptFiles(path)))
      continue
    }
    if (entry.isFile() && ['.ts', '.tsx'].includes(extname(entry.name))) files.push(path)
  }
  return files
}

async function findingsInFile(file: string): Promise<Finding[]> {
  const sourceText = await readFile(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const findings: Finding[] = []

  const visit = (node: ts.Node): void => {
    const literalText = japaneseBearingText(node)
    if (literalText !== null && JAPANESE_CHARACTER.test(literalText)) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
      findings.push({
        file: toRepositoryPath(file),
        line: position.line + 1,
        column: position.character + 1,
        kind: ts.SyntaxKind[node.kind],
        sourceText: node.getText(sourceFile).trim(),
      })
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return findings
}

function japaneseBearingText(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
    return node.text
  }
  if (
    node.kind === ts.SyntaxKind.TemplateHead ||
    node.kind === ts.SyntaxKind.TemplateMiddle ||
    node.kind === ts.SyntaxKind.TemplateTail ||
    node.kind === ts.SyntaxKind.RegularExpressionLiteral
  ) {
    return (node as ts.Node & { readonly text: string }).text
  }
  return null
}

function toRepositoryPath(file: string): string {
  return relative(PROJECT_ROOT, file).split(sep).join('/')
}

function findingKey(entry: Pick<Finding, 'file' | 'kind' | 'sourceText'>): string {
  return `${entry.file}\u0000${entry.kind}\u0000${entry.sourceText}`
}

function allowlistKey(entry: HardcodedJapaneseAllowlistEntry): string {
  return findingKey(entry)
}

function formatFindings(findings: readonly Finding[]): string {
  return findings
    .map(
      (finding) =>
        `  ${finding.file}:${finding.line}:${finding.column} [${finding.kind}] ${singleLine(
          finding.sourceText,
        )}`,
    )
    .join('\n')
}

function formatAllowlist(entries: readonly HardcodedJapaneseAllowlistEntry[]): string {
  return entries
    .map((entry) => `  ${entry.file} [${entry.kind}] ${singleLine(entry.sourceText)}`)
    .join('\n')
}

function singleLine(sourceText: string): string {
  return sourceText.replace(/\s+/g, ' ').trim()
}
