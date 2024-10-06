import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  clean: true,
  declaration: true,
  externals: [
    'unocss',
    '@unocss/preset-uno',
    '@unocss/preset-mini',
    '@unocss/rule-utils',
  ],
})
