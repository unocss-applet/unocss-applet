import type { Preset } from 'unocss'
import { presetUno } from '@unocss/preset-uno'
import type { PresetUnoOptions, Theme } from '@unocss/preset-uno'
import { normalizePreflights } from '@unocss/preset-mini'
import { appletPreflights, defaultPreflights } from './preflights'

export type { Theme }

// PresetUnoOptions https://github.com/unocss/unocss/blob/main/packages/preset-uno/src/index.ts#L9
// PresetMiniOptions https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/index.ts#L30-L55
export interface PresetAppletOptions extends PresetUnoOptions {
  /**
   * Enable applet
   * @default true
   */
  enable?: boolean

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$']
   */
  unsupportedChars?: string[]
}

export default function presetApplet(options: PresetAppletOptions = {}): Preset<Theme> {
  const enable = options.enable ?? true
  if (!enable)
    return presetUno(options)

  options.dark = options.dark ?? 'class'
  options.attributifyPseudo = options.attributifyPseudo ?? false
  options.preflight = options.preflight ?? true
  options.variablePrefix = options.variablePrefix ?? 'un-'

  const UNSUPPORTED_CHARS = ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}']
  if (options.unsupportedChars)
    UNSUPPORTED_CHARS.push(...options.unsupportedChars)

  const ESCAPED_ESCAPED_UNSUPPORTED_CHARS = UNSUPPORTED_CHARS.map(char => `\\\\\\${char}`)
  const charTestReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`)
  const charReplaceReg = new RegExp(`${ESCAPED_ESCAPED_UNSUPPORTED_CHARS.join('|')}`, 'g')

  function unoCSSToAppletProcess(str: string) {
    if (charTestReg.test(str))
      str = str.replace(charReplaceReg, '_a_')
    return str
  }

  return {
    ...presetUno({ ...options, preflight: false }),
    name: 'unocss-preset-applet',
    preflights: options.preflight
      ? normalizePreflights(enable ? appletPreflights : defaultPreflights, options.variablePrefix)
      : [],
    postprocess: [
      (util) => {
        enable && (util.selector = unoCSSToAppletProcess(util.selector))
        return util
      },
    ],
  }
}
