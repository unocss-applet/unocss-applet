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
})
