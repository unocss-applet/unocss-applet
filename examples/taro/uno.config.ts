import type { Preset, SourceCodeTransformer } from 'unocss'
import process from 'node:process'
import { defineConfig, presetAttributify, presetIcons } from 'unocss'

import {
  presetApplet,
  presetRemRpx,
  transformerAttributify,
} from 'unocss-applet'

// taro 小程序端 TARO_ENV 非 h5
const isApplet = process.env.TARO_ENV !== 'h5'
const presets: Preset[] = []
const transformers: SourceCodeTransformer[] = []

if (isApplet) {
  presets.push(presetApplet())
  presets.push(presetRemRpx())
  transformers.push(transformerAttributify({ ignoreAttributes: ['block'] }))
}
else {
  presets.push(presetApplet())
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
  presets.push(presetAttributify())
}

export default defineConfig({
  theme: {
    colors: {
      primary: '#a855f7',
      secondary: '#1ABCFE',
      success: '#0ACF83',
      warning: '#FF9F43',
      error: '#FF5C5C',
      info: '#373e47',
    },
  },
  presets: [
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    ...presets,
  ],
  transformers: [
    ...transformers,
  ],
})
