import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
