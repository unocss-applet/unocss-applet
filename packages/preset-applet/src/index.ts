import type { Preset } from 'unocss'
import { presetUno } from 'unocss'
import type { Theme } from '@unocss/preset-uno'
import { normalizePreflights } from '@unocss/preset-mini'
import { UNSUPPORTED_CHARS, encodeNonSpaceLatin } from '../../shared/src'
import { appletPreflights } from './preflights'
import type { PresetAppletOptions } from './types'
import { variantSpaceAndDivide } from './variants'
import { transformerApplet } from './transformers'

export * from './types'

export function presetApplet(options: PresetAppletOptions = {}): Preset<Theme> {
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
  // https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/_rules/question-mark.ts
  _presetUno.rules?.pop()
  // remove the internal space and divide variant
  _presetUno.variants?.splice(1, 1, ...variantSpaceAndDivide(options))

  return {
    ..._presetUno,
    name: 'unocss-preset-applet',
    preflights: options.preflight ? normalizePreflights(appletPreflights, options.variablePrefix) : [],
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
}

export default presetApplet
