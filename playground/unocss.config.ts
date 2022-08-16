import { defineConfig, presetIcons, transformerDirectives } from 'unocss'

import { presetApplet, presetRemToRpx, transformerRenameClass } from 'unocss-applet'

export default defineConfig({
  presets: [
    presetApplet({
      enableApplet: !(process.env.UNI_PLATFORM === 'h5'),
    }),
    presetRemToRpx(),
    presetIcons(),
  ],
  transformers: [
    transformerDirectives(),
    transformerRenameClass({
      enableRename: !(process.env.UNI_PLATFORM === 'h5'),
    }),
  ],
})
