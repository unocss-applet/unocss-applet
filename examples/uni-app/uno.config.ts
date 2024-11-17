import type { Preset, SourceCodeTransformer } from 'unocss'
import process from 'node:process'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

import {
  presetApplet,
  presetRemRpx,
  transformerAttributify,
} from 'unocss-applet'

const isApplet = process.env?.UNI_PLATFORM?.startsWith('mp') ?? false
const presets: Preset[] = []
const transformers: SourceCodeTransformer[] = []

if (isApplet) {
  presets.push(presetApplet())
  presets.push(presetRemRpx())
  transformers.push(transformerAttributify({ ignoreAttributes: ['block'] }))
}
else {
  presets.push(presetUno())
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
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
  shortcuts: {
    'u-text-color': 'text-[#323233] dark:text-[#F5F5F5]',
  },
  safelist: [
    ...['primary', 'secondary', 'success', 'warning', 'error', 'info'].map(c => `bg-${c}`),
  ],
  presets: [
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    /**
     * you can add `presetAttributify()` here to enable unocss attributify mode prompt
     * although preset is not working for applet, but will generate useless css
     */
    presetAttributify(),
    ...presets,
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
    ...transformers,
  ],

})
