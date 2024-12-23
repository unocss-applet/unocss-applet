import type { PresetAppletOptions } from './types'
import { definePreset } from '@unocss/core'
import { presetUno } from '@unocss/preset-uno'
import { encodeNonSpaceLatin, UNSUPPORTED_CHARS } from '../../shared/src'
import { preflights } from './preflights'
import { transformerApplet } from './transformers'
import { variantSpaceAndDivide, variantWildcard } from './variants'

export * from './types'

export const presetApplet = definePreset((options: PresetAppletOptions = {}) => {
  options.preflight = options.preflight ?? true
  options.variablePrefix = options.variablePrefix ?? 'un-'

  const _UNSUPPORTED_CHARS = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]

  function unoCSSToAppletProcess(str: string) {
    const ESCAPED_ESCAPED_UNSUPPORTED_CHARS = _UNSUPPORTED_CHARS.map(char => `\\\\\\${char}`)
    const charTestReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`)
    const charReplaceReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`, 'g')
    if (charTestReg.test(str))
      str = str.replace(charReplaceReg, '_a_')
    return str
  }

  const _presetUno = presetUno({ ...options, preflight: false })
  // remove the last rule
  // https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_rules/default.ts#L86
  _presetUno.rules?.pop()
  // remove the internal space and divide variant
  _presetUno.variants?.splice(1, 1, ...variantSpaceAndDivide(options), ...variantWildcard(options))

  return {
    ..._presetUno,
    name: 'unocss-preset-applet',
    preflights: preflights(options),
    postprocess: [
      (util) => {
        if (util.selector) {
          util.selector = unoCSSToAppletProcess(util.selector)
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
})

export default presetApplet

export { transformerApplet }
