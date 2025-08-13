import { defineConfig, presetAttributify, presetIcons } from 'unocss'
import { presetApplet, presetRemRpx, transformerAttributify } from 'unocss-applet'

export default defineConfig({
  rules: [['custom-rule', { color: 'red' }]],
  shortcuts: {
    'custom-shortcut': 'text-lg text-orange hover:text-teal',
  },
  presets: [
    presetApplet({
      preset: 'wind3',
    }),
    presetAttributify(),
    presetRemRpx({ mode: 'rpx2rem' }),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  transformers: [
    transformerAttributify(),
  ],
})
