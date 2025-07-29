import type { PresetWind3Options } from '@unocss/preset-wind3'
import type { PresetWind4Options } from '@unocss/preset-wind4'

import type { PresetAppletOptions } from './types'
import { definePreset } from '@unocss/core'
import { presetWind3 as internalPresetWind3 } from '@unocss/preset-wind3'
import { presetWind4 as internalPresetWind4 } from '@unocss/preset-wind4'
import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'
import { preflights } from './preflights'
import { transformerApplet } from './transformers'
import { variantSpaceAndDivide, variantWildcard } from './variants'

export * from './types'

export function presetApplet(options: PresetAppletOptions = {}) {
  options.preset = options.preset ?? 'wind3'
  const unsupportedChars = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
  const escapedUnsupportedChars = unsupportedChars.map(char => `\\\\\\${char}`)
  const charTestReg = new RegExp(`${escapedUnsupportedChars.join('|')}`)
  const charReplaceReg = new RegExp(charTestReg, 'g')

  function replaceUnsupportedChars(str: string) {
    if (charTestReg.test(str))
      str = str.replace(charReplaceReg, '_a_')
    return str
  }

  return definePreset((presetOptions: PresetWind3Options | PresetWind4Options = {}) => {
    presetOptions = options.presetOptions ?? {}
    let preset

    if (options.preset === 'wind3') {
      preset = internalPresetWind3({ ...(presetOptions as PresetWind3Options), preflight: false })
      /**
       * remove the last rule
       * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-mini/src/_rules/default.ts#L86
       */
      preset.rules?.pop()
      /**
       * remove the internal space and divide variant
       * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind3/src/variants/default.ts#L14
       */
      preset.variants?.splice(1, 1, ...variantSpaceAndDivide(options), ...variantWildcard(options))
    }
    else if (options.preset === 'wind4') {
      preset = internalPresetWind4({ ...(presetOptions as PresetWind4Options) })

      /**
       * remove the last rule
       * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/rules/default.ts#L134
       */
      preset.rules?.pop()
    }

    return {
      ...preset,
      name: 'unocss-preset-applet',
      preflights: preflights(options),
      postprocess: [
        (util) => {
          if (util.selector) {
            util.selector = replaceUnsupportedChars(util.selector)
            util.selector = encodeNonSpaceLatin(util.selector)
          }
          return util
        },
      ],
      configResolved(config) {
        if (!config.transformers)
          config.transformers = []
        config.transformers.push(transformerApplet(options))
      },
    }
  },
  )
}

export default presetApplet

export { transformerApplet }
