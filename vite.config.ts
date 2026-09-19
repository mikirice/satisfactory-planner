import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import { appPagePath } from './src/plan/item-pages.ts'

const HERE = fileURLToPath(new URL('.', import.meta.url))

/**
 * アイコン一覧（src/data/icons.json）と実ファイル（public/icons）のズレを
 * **ビルド時に警告する**（ビルドは止めない）。
 *
 * アイコンはゲームアセットで、権利上いつ消す判断になってもいいように隔離してある。
 * 消えていても画面はテキスト表示に戻るだけなので失敗にはせず、気付けるように警告だけ出す。
 */
function iconManifestCheck(): Plugin {
  return {
    name: 'icon-manifest-check',
    apply: 'build',
    buildStart() {
      const manifest = `${HERE}src/data/icons.json`
      if (!existsSync(manifest)) return
      const ids = JSON.parse(readFileSync(manifest, 'utf8')) as string[]
      const missing = ids.filter((id) => !existsSync(`${HERE}public/icons/${id}.png`))
      if (missing.length > 0) {
        this.warn(
          `[icons] ${missing.length} 件の画像が public/icons にありません` +
            `（表示はテキストに戻ります / npm run fetch-icons で取得）: ${missing.slice(0, 10).join(', ')}`,
        )
      }
    },
  }
}

/**
 * dev だけ、/ を計画ツール（/app/）へ送る。
 *
 * 本番のトップ（/）は静的ランディング（scripts/build-pages.ts が dist/index.html に書く）で
 * vite の管轄外。dev サーバーにはその index.html が無いので、`npm run dev` を開いたときに
 * これまで通りツールが出るようにリダイレクトする（`npm run preview` は dist/ を配るので対象外）。
 */
function devRootRedirect(): Plugin {
  return {
    name: 'dev-root-redirect',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const [pathname, query] = (request.url ?? '/').split('?', 2)
        if (pathname !== '/' && pathname !== '/index.html') return next()
        response.statusCode = 302
        response.setHeader('Location', `${appPagePath()}${query === undefined ? '' : `?${query}`}`)
        response.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), iconManifestCheck(), devRootRedirect()],
  build: {
    // 計画ツール本体は /app/ に置く（トップは build-pages が書く静的ランディング）。
    rollupOptions: { input: resolve(HERE, 'app/index.html') },
    // exceljs(≈940kB) / elkjs(≈1.4MB) は重いが、どちらも遅延 import で
    // 初期表示には載らない（Excelダウンロード時・フローチャートを開いたとき）。
    // 既定の 500kB では毎回警告が出るだけなので、実サイズに合わせて上げておく。
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
