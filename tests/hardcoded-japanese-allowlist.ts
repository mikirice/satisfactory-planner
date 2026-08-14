export type HardcodedJapaneseAllowlistEntry = Readonly<{
  /** Repository-relative POSIX path. */
  file: `src/ui/${string}` | `src/export/${string}`
  /** TypeScript SyntaxKind name, such as StringLiteral or RegularExpressionLiteral. */
  kind: string
  /** Exact source text for the AST node, including quotes or regex delimiters. */
  sourceText: string
  /** Why this Japanese source is intentional and is not translatable UI copy. */
  justification: string
}>

/**
 * Keep this list empty where possible. Every exception must be non-display behavior,
 * exact-match a single AST node, and explain why moving it into a locale dictionary
 * would be incorrect.
 */
export const HARDCODED_JAPANESE_ALLOWLIST: readonly HardcodedJapaneseAllowlistEntry[] = []
