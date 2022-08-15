import type { Preset } from 'unocss'
import type { PresetMiniOptions, Theme } from '@unocss/preset-mini'
import { rules, shortcuts, theme, variants } from '@unocss/preset-wind'
import { preflights } from './preflights'
import { unoCSSToAppletProcess } from './process'
import { variantColorMix } from './variants/mix'

export type { Theme }

export interface PresetAppletOptions extends PresetMiniOptions {
  enableApplet?: boolean
}

export const presetApplet = (options: PresetAppletOptions = {}): Preset<Theme> => {
  options.dark = options.dark ?? 'class'
  options.attributifyPseudo = options.attributifyPseudo ?? false
  options.enableApplet = options.enableApplet ?? false

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
    preflights,
    postprocess: [
      (util) => {
        options.enableApplet && (util.selector = unoCSSToAppletProcess(util.selector))
        return util
      }],
    prefix: options.prefix,
  }
}

export default presetApplet

