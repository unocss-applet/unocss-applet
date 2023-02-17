import type { Preset } from 'unocss'

const rpxRE = /^-?[\.\d]+rpx$/

export interface RpxToRemOptions {
  /**
   * 1rem = n px
   * @default 16
   */
  baseFontSize?: number

  /**
   * screen width in px
   * @default 375
   */
  screenWidth?: number
}

export default function rpxToRemPreset(options: RpxToRemOptions = {}): Preset {
  const { baseFontSize = 16, screenWidth = 375 } = options

  return {
    name: 'unocss-preset-rpx-to-rem',
    postprocess: (util) => {
      util.entries.forEach((i) => {
        const value = i[1]
        if (value && typeof value === 'string' && rpxRE.test(value))
          i[1] = `${(+value.slice(0, -3) / (750 / screenWidth) / baseFontSize)}rem`
      })
    },
  }
}
