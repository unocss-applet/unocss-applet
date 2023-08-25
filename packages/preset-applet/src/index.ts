import type { Preset, Variant } from 'unocss'
import { presetUno } from 'unocss'
import type { PresetUnoOptions, Theme } from '@unocss/preset-uno'
import { normalizePreflights } from '@unocss/preset-mini'
import { UNSUPPORTED_CHARS, encodeNonLatin } from '../../shared/src'
import { appletPreflights, defaultPreflights } from './preflights'

export type { Theme }

// PresetUnoOptions https://github.com/unocss/unocss/blob/main/packages/preset-uno/src/index.ts#L9
export interface PresetAppletOptions extends PresetUnoOptions {
  /**
   * Enable applet
   * @default true
   */
  enable?: boolean

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'']
   */
  unsupportedChars?: string[]

  /**
   * Space Between and Divide Width Elements
   * @default ['view', 'button', 'text', 'image']
   */
  betweenElements?: string[]
}

function variantSpaceAndDivide(options: PresetAppletOptions): Variant<Theme>[] {
  const betweenElements = options?.betweenElements ?? ['view', 'button', 'text', 'image']

  return [
    (matcher) => {
      if (matcher.startsWith('_'))
        return

      if (/space-?([xy])-?(-?.+)$/.test(matcher) || /divide-/.test(matcher)) {
        return {
          matcher,
          selector: (input) => {
            const selectors = betweenElements.map(el => `${input}>${el}+${el}`)
            return selectors.join(',')
          },
        }
      }
    },
  ]
}

export default function presetApplet(options: PresetAppletOptions = {}): Preset<Theme> {
  const enable = options.enable ?? true
  if (!enable)
    return presetUno(options)

  options.dark = options.dark ?? 'class'
  options.attributifyPseudo = options.attributifyPseudo ?? false
  options.preflight = options.preflight ?? true
  options.variablePrefix = options.variablePrefix ?? 'un-'

  const _UNSUPPORTED_CHARS = [...UNSUPPORTED_CHARS, ...(options.unsupportedChars ?? [])]

  const ESCAPED_ESCAPED_UNSUPPORTED_CHARS = _UNSUPPORTED_CHARS.map(char => `\\\\\\${char}`)
  const charTestReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`)
  const charReplaceReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`, 'g')

  function unoCSSToAppletProcess(str: string) {
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
    preflights: options.preflight
      ? normalizePreflights(enable ? appletPreflights : defaultPreflights, options.variablePrefix)
      : [],
    postprocess: [
      (util) => {
        if (enable && util.selector) {
          util.selector = unoCSSToAppletProcess(util.selector)
          util.selector = encodeNonLatin(util.selector)
        }
        return util
      },
    ],
  }
}
