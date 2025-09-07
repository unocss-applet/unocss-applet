import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss'
import { presetApplet, presetRemRpx, transformerAttributify } from 'unocss-applet'

// eslint-disable-next-line node/prefer-global/process
const isApplet = process?.env?.UNI_PLATFORM?.startsWith('mp-') ?? false

const presets = []
const transformers = []

if (isApplet) {
  presets.push(presetApplet({ preset: 'wind3' }))
  /**
   * rem2rpx is not working for playground
   */
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
  transformers.push(transformerAttributify({ ignoreAttributes: ['block'] }))
}
else {
  presets.push(presetWind3())
  presets.push(presetAttributify())
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
}

export default defineConfig({
  presets: [
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
    ...presets,
  ],
  transformers: [
    ...transformers,
  ],
})
