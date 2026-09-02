import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import { injectFaqIntoIndexHtml } from './scripts/static-pages/faq.ts'
import { SITE_URL } from './scripts/static-pages/templates.ts'

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
 * トップの index.html に FAQ（本文＋FAQPage）を差し込む。
 *
 * トップは静的ページ生成（scripts/build-pages.ts）の対象外なので、ここで差し込む。
 * dev でも build でも同じ関数を通すため、表示と構造化データがズレることはない。
 */
function faqSection(): Plugin {
  return {
    name: 'faq-section',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => injectFaqIntoIndexHtml(html, SITE_URL),
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), iconManifestCheck(), faqSection()],
  build: {
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
