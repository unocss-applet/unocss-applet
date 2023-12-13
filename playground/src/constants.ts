import { version } from '../../package.json'

export const VERSION = version

export const defaultHTML = `
<div h-full text-center flex select-none transition="all 400">
  <div ma>
    <div text-3xl m-2.5 fw100 animate-bounce-alt animate-count-infinite animate-duration-1s>
      UnoCSS Applet
    </div>
    <div op30 text-lg fw300 m1>
      Using UnoCSS in applet(UniApp / Taro).
    </div>
    <div m2 flex justify-center text-2xl op30 hover="op80">
      <a i-carbon-logo-github text-inherit href="https://github.com/unocss-applet/unocss-applet" target="_blank"></a>
    </div>
  </div>
</div>
<div absolute bottom-5 right-0 left-0 text-center op30 fw300>
  Thanks @<a text-inherit href="https://github.com/unocss/unocss" target="_blank">UnoCSS</a>
</div>
`.trim()

export const defaultConfigRaw = `
import { defineConfig, presetAttributify, presetIcons } from 'unocss'
import { presetApplet, presetRemRpx, transformerAttributify } from 'unocss-applet'

export default defineConfig({
  rules: [['custom-rule', { color: 'red' }]],
  shortcuts: {
    'custom-shortcut': 'text-lg text-orange hover:text-teal',
  },
  presets: [
    presetApplet(),
    presetAttributify(),
    presetRemRpx({ mode: 'rpx2rem' }),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  transformers: [
    transformerAttributify()
  ],
})
`.trim()

export const defaultCSS = `
/* Write custom CSS here, and transformer support. For example: */
/* .custom {
  font-weight: 500;
  @apply p1 text-(white xl);
  background-color: theme('colors.red.400');
} */
`.trim()

export const customCSSLayerName = 'playground'

export const defaultOptions = '{}'

export const STORAGE_KEY = 'last-search'
