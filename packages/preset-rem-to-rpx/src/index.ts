import type { Preset } from 'unocss'

const remRE = /^-?[\.\d]+rem$/

export interface RemToRpxOptions {
  /**
   * Enable applet, only build applet should be true
   * e.g. In uniapp set `enable: !(process.env.UNI_PLATFORM === 'h5')` to disable for h5
   * @default true
   */
  enable?: boolean

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

export default function remToRpxPreset(options: RemToRpxOptions = {}): Preset {
  const { baseFontSize = 16, screenWidth = 375 } = options

  const enable = options.enable ?? true

  return {
    name: 'unocss-preset-rem-to-rpx',
    postprocess: enable
      ? (util) => {
          util.entries.forEach((i) => {
            const value = i[1]
            if (value && typeof value === 'string' && remRE.test(value)) {
              i[1] = `${
                +value.slice(0, -3) * baseFontSize * (750 / screenWidth)
              }rpx`
            }
          })
        }
      : undefined,
  }
}
