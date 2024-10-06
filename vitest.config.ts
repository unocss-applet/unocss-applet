import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

function r(p: string) {
  return resolve(__dirname, p)
}

export default defineConfig({
  optimizeDeps: {
    entries: [],
  },
  resolve: {
    alias: {
      '@unocss-applet/preset-applet': r('./packages/preset-applet/src'),
      '@unocss-applet/preset-rem-rpx': r('./packages/preset-rem-rpx/src'),
      '@unocss-applet/transformer-attributify': r('./packages/transformer-attributify/src'),
      '@unocss-applet/shared': r('./packages/shared/src'),
      'unocss-applet': r('./packages/unocss-applet/src'),
    },
  },
})
