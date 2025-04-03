import type { PresetAppletOptions } from './types'

import { definePreset } from '@unocss/core'
import { presetWind3 as internalPresetWind3 } from '@unocss/preset-wind3'
import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'
import { preflights } from './preflights'
import { transformerApplet } from './transformers'
import { variantSpaceAndDivide, variantWildcard } from './variants'

export * from './types'

export const presetApplet = definePreset(
  (options: PresetAppletOptions = {}) => {
    options.preflight = options.preflight ?? true
    options.variablePrefix = options.variablePrefix ?? 'un-'

    const unsupportedChars = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]
    const escapedUnsupportedChars = unsupportedChars.map(char => `\\\\\\${char}`)
    const charTestReg = new RegExp(`${escapedUnsupportedChars.join('|')}`)
    const charReplaceReg = new RegExp(charTestReg, 'g')

    function replaceUnsupportedChars(str: string) {
      if (charTestReg.test(str))
        str = str.replace(charReplaceReg, '_a_')
      return str
    }

    const presetWind3 = internalPresetWind3({ ...options, preflight: false })
    /**
     * remove the last rule
     * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-mini/src/_rules/default.ts#L86
     */
    presetWind3.rules?.pop()
    /**
     * remove the internal space and divide variant
     * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind3/src/variants/default.ts#L14
     */
    presetWind3.variants?.splice(1, 1, ...variantSpaceAndDivide(options), ...variantWildcard(options))

    return {
      ...presetWind3,
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

export default presetApplet

export { transformerApplet }
