import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from '@unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // base: '/play/',

  resolve: {
    alias: {
      '~/': `${resolve(__dirname, 'src')}/`,
    },
  },

  plugins: [
    Vue(),
    UnoCSS(),
  ],

  optimizeDeps: {
    exclude: [
      '@iconify/utils/lib/loader/fs',
      '@iconify/utils/lib/loader/install-pkg',
      '@iconify/utils/lib/loader/node-loader',
      '@iconify/utils/lib/loader/node-loaders',
    ],
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '@iconify/utils/lib/loader/fs',
        '@iconify/utils/lib/loader/install-pkg',
        '@iconify/utils/lib/loader/node-loader',
        '@iconify/utils/lib/loader/node-loaders',
      ],
      input: [
        './index.html',
        './__play.html',
      ],
    },
  },
})
