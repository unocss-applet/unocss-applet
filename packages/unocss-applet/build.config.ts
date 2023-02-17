import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/preset-applet',
    'src/preset-rem-rpx',
    'src/transformer-applet',
    'src/transformer-attributify',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  externals: [
    'unocss',
  ],
})
