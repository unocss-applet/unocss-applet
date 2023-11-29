import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from '@unocss/vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/play/',
  plugins: [
    Vue(),
    UnoCSS(),
    Components({
      dirs: [
        'src/components',
      ],
      dts: 'src/components.d.ts',
    }),
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core',
      ],
      dirs: [
        'src/composables',
      ],
      vueTemplate: true,
      dts: 'src/auto-imports.d.ts',
    }),
  ],
})
