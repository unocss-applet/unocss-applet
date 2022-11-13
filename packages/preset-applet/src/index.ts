import type { Preset } from 'unocss'
import type { PresetMiniOptions, Theme } from '@unocss/preset-mini'
import { rules, shortcuts, theme, variants } from '@unocss/preset-wind'
import { preflights as defaultApplet } from '@unocss/preset-mini'
import { preflights as preflightsApplet } from './preflights'
import { unoCSSToAppletProcess } from './process'
import { variantColorMix } from './variants/mix'

export type { Theme }

// PresetMiniOptions https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/index.ts#L30-L55
export interface PresetAppletOptions extends PresetMiniOptions {
  /**
   * Enable applet, only build applet should be true
   * e.g. In uniapp set `enable: !(process.env.UNI_PLATFORM === 'h5')` to disable for h5
   * @default true
   */
  enable?: boolean
}

const presetApplet = (options: PresetAppletOptions = {}): Preset<Theme> => {
  options.dark = options.dark ?? 'class'
  options.attributifyPseudo = options.attributifyPseudo ?? false
  options.preflight = options.preflight ?? true
  const enable = options.enable ?? true

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

export default presetApplet

