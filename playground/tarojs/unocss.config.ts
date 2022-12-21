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

const isH5 = process.env.TARO_ENV === 'h5'

export default defineConfig({
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
    presetApplet({ enable: !isH5 }),
    presetAttributify(),
    presetRemToRpx({ enable: !isH5 }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
    // Don't change the following order
    transformerAttributify({ enable: !isH5 }),
    transformerApplet({ enable: !isH5 }),
  ],
})
