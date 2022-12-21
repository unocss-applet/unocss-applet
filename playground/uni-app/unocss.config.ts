import {
  defineConfig,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

import {
  presetApplet,
  presetRemToRpx,
  transformerApplet,
  transformerAttributify,
} from 'unocss-applet'

const isApplet = process.env?.UNI_PLATFORM?.startsWith('mp-')

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
    presetApplet({ enable: isApplet }),
    presetAttributify(),
    presetRemToRpx({ enable: isApplet }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
    // Don't change the following order
    transformerAttributify({ enable: isApplet }),
    transformerApplet({ enable: isApplet }),
  ],

})
