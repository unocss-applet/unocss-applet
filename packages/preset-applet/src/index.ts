import type { Preset } from 'unocss'
import type { PresetMiniOptions, Theme } from '@unocss/preset-mini'
import { rules, shortcuts, theme, variants } from '@unocss/preset-wind'
import { preflights as defaultApplet } from '@unocss/preset-mini'
import { preflights as preflightsApplet } from './preflights'
import { variantColorMix } from './variants/mix'

export type { Theme }

// PresetMiniOptions https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/index.ts#L30-L55
export interface PresetAppletOptions extends PresetMiniOptions {
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
  options.dark = options.dark ?? 'class'
  options.attributifyPseudo = options.attributifyPseudo ?? false
  options.preflight = options.preflight ?? true

  const enable = options.enable ?? true
  const UNSUPPORTED_CHARS = ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$']
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
    name: 'unocss-preset-applet',
    theme,
    rules,
    shortcuts,
    variants: [
      ...variants(options),
      variantColorMix,
    ],
    options,
    preflights: options.preflight ? enable ? preflightsApplet : defaultApplet : [],
    postprocess: [
      (util) => {
        enable && (util.selector = unoCSSToAppletProcess(util.selector))
        return util
      }],
    prefix: options.prefix,
  }
}
