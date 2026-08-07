/**
 * 公式 Docs.json（ゲーム同梱の CommunityResources/Docs）のミラーを data-source/ に取得する。
 *
 * ゲーム本体を持たない環境でもデータ再生成できるようにするためのスクリプト。
 * 入手元・ゲームバージョンは data-source/DATA_SOURCES.md を参照。
 *
 *   npm run fetch-docs          # 無いファイルだけ取得
 *   npm run fetch-docs -- --force  # 常に再取得
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = join(HERE, '..')
export const DATA_SOURCE_DIR = join(PROJECT_ROOT, 'data-source')

/** ミラー元。DATA_SOURCES.md と同じ値を保つこと。 */
export const SOURCE_BASE_URL =
  'https://raw.githubusercontent.com/aringadre76/satisfactory-api/master/Docs'

/** 取得するファイル（en-US = 原文, ja = 日本語ローカライズ）。 */
export const DOCS_FILES = ['en-US.json', 'ja.json', 'CustomVersions.json'] as const

export async function ensureDocs(force = false): Promise<void> {
  await mkdir(DATA_SOURCE_DIR, { recursive: true })
  for (const file of DOCS_FILES) {
    const dest = join(DATA_SOURCE_DIR, file)
    if (!force && existsSync(dest)) {
      console.log(`[fetch-docs] skip (exists): ${file}`)
      continue
    }
    const url = `${SOURCE_BASE_URL}/${file}`
    console.log(`[fetch-docs] downloading ${url}`)
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`[fetch-docs] failed to download ${url}: HTTP ${res.status}`)
    }
    // Docs.json は UTF-16LE。文字列化せずバイト列のまま保存する。
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(dest, buf)
    console.log(`[fetch-docs] saved ${file} (${buf.byteLength.toLocaleString()} bytes)`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await ensureDocs(process.argv.includes('--force'))
}
