import { defineConfig, presetIcons } from 'unocss'

import { presetApplet, presetRemToRpx, transformerRenameClass } from 'unocss-applet'

export default defineConfig({
  presets: [
    presetApplet({ enableApplet: false }),
    presetRemToRpx({ baseFontSize: 16, screenWidth: 375 }),
    presetIcons(),
  ],
  transformers: [
    transformerRenameClass(),
  ],
})
