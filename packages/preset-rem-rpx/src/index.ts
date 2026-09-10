import { definePreset } from '@unocss/core'

const remRE = /(-?[.\d]+)rem/g
const rpxRE = /(-?[.\d]+)rpx/g

export interface RemRpxOptions {
  /**
   * 1rem 等于多少 px
   * @default 16
   */
  baseFontSize?: number

  /**
   * 屏幕宽度，单位 px
   * @default 375
   */
  screenWidth?: number

  /**
   * rem 转 rpx，还是 rpx 转 rem
   * @default 'rem2rpx'
   */
  mode?: 'rem2rpx' | 'rpx2rem'
}

export const presetRemRpx = definePreset((options: RemRpxOptions = {}) => {
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
})

function rem2rpx(value: string, baseFontSize: number, screenWidth: number): string {
  return value.replace(remRE, (_, p1) => `${p1 * baseFontSize * (750 / screenWidth)}rpx`)
}

function rpx2rem(value: string, baseFontSize: number, screenWidth: number): string {
  return value.replace(rpxRE, (_, p1) => `${p1 / (750 / screenWidth) / baseFontSize}rem`)
}

export default presetRemRpx
