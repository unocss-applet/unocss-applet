import type { Preset } from 'unocss'

const remRE = /^-?[\.\d]+rem$/
const rpxRE = /^-?[\.\d]+rpx$/

export interface RemRpxOptions {
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

  /**
   * rem to rpx or rpx to rem
   * @default 'rem2rpx'
   */
  mode?: 'rem2rpx' | 'rpx2rem'
}

export function presetRemRpx(options: RemRpxOptions = {}): Preset {
  const { baseFontSize = 16, screenWidth = 375 } = options
  const mode = options.mode ?? 'rem2rpx'

  return {
    name: 'unocss-preset-rem-rpx',
    postprocess: (util) => {
      util.entries.forEach((i) => {
        const value = i[1]
        if (value && typeof value === 'string') {
          if (mode === 'rem2rpx' && remRE.test(value))
            i[1] = rem2rpx(value, baseFontSize, screenWidth)
          if (mode === 'rpx2rem' && rpxRE.test(value))
            i[1] = rpx2rem(value, baseFontSize, screenWidth)
        }
      })
    },
  }
}

function rem2rpx(value: string, baseFontSize: number, screenWidth: number) {
  return `${+value.slice(0, -3) * baseFontSize * (750 / screenWidth)}rpx`
}

function rpx2rem(value: string, baseFontSize: number, screenWidth: number) {
  return `${+value.slice(0, -3) / (750 / screenWidth) / baseFontSize}rem`
}

export default presetRemRpx
