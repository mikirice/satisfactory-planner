/**
 * アイテム / 生産建物のアイコン画像を public/icons/ に取得する。
 *
 * 入手元は **公式 Wiki（satisfactory.wiki.gg）** の画像。ファイル名は英語表示名
 * （`Item.name.en` / `Building.name.en`）から `File:<Name>.png` を組み立てて MediaWiki API で
 * 解決する（リダイレクト・表記ゆれは API 側が吸収する）。保存名は ClassName にそろえるので、
 * 画面側は `iconPath('Desc_IronPlate_C')` のようにIDだけで参照できる。
 *
 * 画像はゲームアセット（著作権者 Coffee Stain Studios）なので、権利面の扱いと
 * 撤去手順は public/icons/SOURCES.md に書いてある。**アイコンは1フォルダに隔離し、
 * 消しても壊れない**（src/ui/icons.ts が null を返し、画面はテキスト表示に戻る）のが約束。
 *
 *   npm run fetch-icons             # 無いものだけ取得
 *   npm run fetch-icons -- --force  # 全部取り直す
 *
 * 生成物:
 *   public/icons/<ClassName>.png … 画像本体（64px）
 *   public/icons/SOURCES.md      … 入手元・取得日・撤去手順
 *   src/data/icons.json          … アイコンを持つIDの一覧（画面側の解決に使う）
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(HERE, '..')
const DATA_DIR = join(PROJECT_ROOT, 'src', 'data')
const ICON_DIR = join(PROJECT_ROOT, 'public', 'icons')

/** 入手元（SOURCES.md と同じ値を保つこと）。 */
export const WIKI_API = 'https://satisfactory.wiki.gg/api.php'
export const WIKI_PAGE = 'https://satisfactory.wiki.gg/'

/** 取得する幅(px)。表示は 16〜32px なので 64px あれば Retina でも足りる。 */
export const ICON_WIDTH = 64

/** MediaWiki API の titles 上限（匿名は50件）。 */
const BATCH_SIZE = 50

/** 相手先に負荷をかけない程度の並列数。 */
const DOWNLOAD_CONCURRENCY = 4

const USER_AGENT =
  'satisfactory-planner-icon-fetch/1.0 (personal fan tool; one-time asset fetch)'

/**
 * Wiki 側で「未公開アイテム」の穴埋めに使われている画像。
 * `File:Converter.png` などがここへリダイレクトされるので、掴んだら**採用しない**
 * （はてなマークの画像を並べるより、アイコン無し＝文字だけのほうが読みやすい）。
 */
const PLACEHOLDER_TITLES = new Set([
  'File:Unknown item FP.png',
  'File:Unknown building FP.png',
  'File:Unknown.png',
])

type NamedEntity = { id: string; name: { ja: string; en: string } }

/** ID → Wiki のファイル名（`File:...png`）。 */
export function wikiFileTitle(nameEn: string): string {
  return `File:${nameEn.replace(/ /g, '_')}.png`
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T
}

/** 取得対象（アイテム198件 + 生産建物23件）。 */
async function loadTargets(): Promise<NamedEntity[]> {
  const items = await readJson<NamedEntity[]>(join(DATA_DIR, 'items.json'))
  const buildings = await readJson<NamedEntity[]>(join(DATA_DIR, 'buildings.json'))
  const seen = new Set<string>()
  const targets: NamedEntity[] = []
  for (const entity of [...items, ...buildings]) {
    if (seen.has(entity.id)) continue
    seen.add(entity.id)
    targets.push(entity)
  }
  return targets
}

type ImageInfo = { thumburl?: string; url?: string; width?: number; height?: number }
type WikiPage = { title: string; missing?: string; imageinfo?: ImageInfo[] }
type WikiResponse = {
  query?: {
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
    pages?: Record<string, WikiPage>
  }
}

/**
 * ファイル名 → サムネイルURL。
 * API は正規化・リダイレクトでタイトルを書き換えるので、その対応表をたどって
 * 「こちらが投げたタイトル」に戻して返す。
 */
async function resolveThumbUrls(titles: string[]): Promise<Map<string, string>> {
  const resolved = new Map<string, string>()
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE)
    const url =
      `${WIKI_API}?action=query&format=json&formatversion=1&redirects=1` +
      `&prop=imageinfo&iiprop=url|size&iiurlwidth=${ICON_WIDTH}` +
      `&titles=${encodeURIComponent(batch.join('|'))}`
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`[fetch-icons] wiki API failed: HTTP ${res.status} ${url}`)
    const json = (await res.json()) as WikiResponse

    // 投げたタイトル → 最終的なページタイトル（normalized → redirects の順に張り替わる）
    const rename = new Map<string, string>()
    for (const step of [...(json.query?.normalized ?? []), ...(json.query?.redirects ?? [])]) {
      rename.set(step.from, step.to)
    }
    const byTitle = new Map<string, WikiPage>()
    for (const page of Object.values(json.query?.pages ?? {})) byTitle.set(page.title, page)

    for (const title of batch) {
      let current = title
      // 正規化 → リダイレクトの多段を最大5回までたどる（循環対策の上限）
      for (let hop = 0; hop < 5 && rename.has(current); hop += 1) current = rename.get(current)!
      if (PLACEHOLDER_TITLES.has(current)) continue
      const thumb = byTitle.get(current)?.imageinfo?.[0]?.thumburl
      if (thumb) resolved.set(title, thumb)
    }
    console.log(
      `[fetch-icons] resolved ${resolved.size}/${Math.min(i + BATCH_SIZE, titles.length)} titles`,
    )
  }
  return resolved
}

/** PNG の IHDR から幅・高さを読む（デコードはしない）。 */
function pngSize(buf: Buffer): { width: number; height: number } {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/** 画像を1つ落として保存する。アイコンとして使えない画像は弾く。 */
async function download(url: string, dest: string): Promise<number> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  // PNG マジックナンバー（HTMLのエラーページを掴んでいないか）
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`not a PNG: ${url}`)
  }
  // Wiki には「アイコン」ではなくスクリーンショットが同じ名前で置かれていることがある。
  // ゲームのアイコンは必ず正方形なので、縦横が違うものは採用しない（＝文字だけで表示）。
  const { width, height } = pngSize(buf)
  if (width !== height) {
    throw new Error(`not square (${width}x${height}, likely a screenshot): ${url}`)
  }
  await writeFile(dest, buf)
  return buf.byteLength
}

/** 並列数を絞って順に流す。 */
async function inPool<T>(jobs: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = []
  let next = 0
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (next < jobs.length) {
      const index = next
      next += 1
      results[index] = await jobs[index]!()
    }
  })
  await Promise.all(workers)
  return results
}

export async function fetchIcons(force = false): Promise<void> {
  await mkdir(ICON_DIR, { recursive: true })
  const targets = await loadTargets()
  console.log(`[fetch-icons] targets: ${targets.length} (items + buildings)`)

  const wanted = targets.filter((t) => force || !existsSync(join(ICON_DIR, `${t.id}.png`)))
  console.log(`[fetch-icons] to download: ${wanted.length} (skip existing: ${targets.length - wanted.length})`)

  const missing: string[] = []
  if (wanted.length > 0) {
    const titles = wanted.map((t) => wikiFileTitle(t.name.en))
    const thumbs = await resolveThumbUrls(titles)

    const jobs = wanted.map((target, index) => async () => {
      const dest = join(ICON_DIR, `${target.id}.png`)
      const url = thumbs.get(titles[index]!)
      if (!url) {
        missing.push(`${target.id} (${target.name.en}): no usable file on the wiki`)
        await rm(dest, { force: true }) // 前回の残骸を残さない
        return
      }
      try {
        await download(url, dest)
      } catch (error) {
        missing.push(`${target.id} (${target.name.en}): ${String(error)}`)
        await rm(dest, { force: true })
      }
    })
    await inPool(jobs, DOWNLOAD_CONCURRENCY)
  }

  // --- 実際に置かれている画像から一覧を作る（欠けたものは載せない＝画面はテキストに戻る） ---
  const files = (await readdir(ICON_DIR)).filter((f) => f.endsWith('.png'))
  const present = new Set(files.map((f) => f.replace(/\.png$/, '')))
  const ids = targets.map((t) => t.id).filter((id) => present.has(id)).sort()
  const orphans = [...present].filter((id) => !targets.some((t) => t.id === id))

  let totalBytes = 0
  for (const file of files) totalBytes += (await stat(join(ICON_DIR, file))).size

  const uncovered = targets.filter((t) => !present.has(t.id))

  await writeFile(join(DATA_DIR, 'icons.json'), `${JSON.stringify(ids, null, 2)}\n`, 'utf8')
  await writeFile(
    join(ICON_DIR, 'SOURCES.md'),
    sourcesDoc(ids.length, targets.length, totalBytes, uncovered),
    'utf8',
  )

  console.log(`[fetch-icons] icons: ${ids.length}/${targets.length}`)
  console.log(`[fetch-icons] total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
  if (missing.length > 0) console.log(`[fetch-icons] MISSING (${missing.length}):\n  ${missing.join('\n  ')}`)
  if (orphans.length > 0) console.log(`[fetch-icons] orphan files (not in data): ${orphans.join(', ')}`)
}

function sourcesDoc(
  count: number,
  total: number,
  bytes: number,
  uncovered: NamedEntity[],
): string {
  const today = new Date().toISOString().slice(0, 10)
  const uncoveredDoc =
    uncovered.length === 0
      ? '（なし。全件そろっている）'
      : uncovered.map((t) => `- \`${t.id}\`（${t.name.ja} / ${t.name.en}）`).join('\n')
  return `# アイコン画像の出典と撤去手順

このフォルダの PNG は **ゲーム内アイコン（Satisfactory）** です。
\`scripts/fetch-icons.ts\`（\`npm run fetch-icons\`）が自動取得したもので、手作業の加工はしていません。

## 入手元

- 取得日: ${today}
- 入手元: 公式 Wiki <${WIKI_PAGE}>（wiki.gg・MediaWiki API 経由）
  - API: \`${WIKI_API}?action=query&prop=imageinfo&iiurlwidth=${ICON_WIDTH}&titles=File:<英語名>.png\`
  - Wiki 上のライセンス表記は「Coffee Stain Studios が権利を持つゲーム由来の素材」
    （\`{{License/first-party}}\`）
- 解像度: 幅 ${ICON_WIDTH}px のサムネイル（元は 256 / 512px）
- ファイル名: **Docs.json の ClassName**（例 \`Desc_IronPlate_C.png\` / \`Build_ConstructorMk1_C.png\`）
  - Wiki 側のファイル名は英語表示名なので、\`src/data/items.json\` / \`buildings.json\` の
    \`name.en\` から \`File:<Name>.png\` を組み立てて解決している
- 収録数: ${count} / ${total} 件・合計 ${(bytes / 1024 / 1024).toFixed(2)} MB

### 採用しなかったもの（アイコン無し＝画面では文字だけ表示）

Wiki 側に**アイコンではない画像**しか無いものは取り込んでいない。判定は自動:

- \`File:Unknown item FP.png\` / \`File:Unknown building FP.png\` へのリダイレクト
  （未公開アイテムの「？」画像）
- 正方形でない PNG（アイコンではなくスクリーンショットが同名で置かれている場合）

${uncoveredDoc}

## 権利について（グレーであることの明示）

アイコンの著作権は **Coffee Stain Studios** にあります。本ツールは非商用の個人向けファンツールで、
生産計画の可読性のために引用的に表示しているだけですが、**ゲームアセットの再配布は
公式に許諾されたものではありません**（同種のファンツールでは長年慣行的に使われている、というのが
現状の判断根拠）。権利者から要請があれば**即座に全削除**します。

## 撤去手順（1分で終わる・アプリは壊れない）

\`\`\`sh
rm -rf public/icons
echo '[]' > src/data/icons.json
npm run build
\`\`\`

- \`src/ui/icons.ts\` の \`iconPath()\` が \`null\` を返すようになり、画面は**元のテキスト表示に戻る**
- 画像だけ消して \`src/data/icons.json\` を戻し忘れても、\`<img>\` の \`onError\` で
  そのアイコンだけ消える（レイアウトは崩れるが動作は継続する）
- アイコンを参照しているのは \`src/ui/ItemIcon.tsx\` / \`src/ui/icons.ts\` の2ファイルだけ

## 再取得

\`\`\`sh
npm run fetch-icons           # 無いものだけ
npm run fetch-icons -- --force  # 全部取り直す
\`\`\`
`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await fetchIcons(process.argv.includes('--force'))
}
