import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind3,
  transformerCompileClass,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  theme: {
    fontFamily: {
      sans: '\'Inter\', sans-serif',
      mono: '\'Fira Code\', monospace',
    },
  },
  shortcuts: {
    responsiveBorder: 'absolute flex items-center justify-center bg-light-700 dark:bg-dark-800 [&>span]-(w-4 h-4 text-gray-400)',
  },
  presets: [
    presetAttributify(),
    presetWind3(),
    presetIcons(),
  ],
  transformers: [
    transformerCompileClass(),
    transformerVariantGroup(),
    transformerDirectives(),
  ],
})
