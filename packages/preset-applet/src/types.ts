import type { PresetWind3Options } from '@unocss/preset-wind3'
import type { PresetWind4Options } from '@unocss/preset-wind4'

export interface PresetAppletOptions {

  /**
   * Preset to use
   * @see https://unocss.dev/presets/wind3
   * @see https://unocss.dev/presets/wind4
   * @default 'wind3'
   */
  preset?: 'wind3' | 'wind4'

  /**
   * Preset options for wind3 or wind4
   * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind3/src/index.ts#L16 for `PresetWind3Options`
   * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/index.ts#L52 for `PresetWind4Options`
   */
  presetOptions?: PresetWind3Options | PresetWind4Options

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default
   * ```
   * ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\', '"', '?', '*']
   * ```
   */
  unsupportedChars?: string[]

  /**
   * Space Between and Divide Width Elements
   * @default
   * ```
   * ['view', 'button', 'text', 'image']
   * ```
   */
  betweenElements?: string[]

  /**
   * Space Between and Divide Width Elements
   * @default
   * ```
   * ['view', 'button', 'text', 'image']
   * ```
   */
  wildcardElements?: string[]
}

export interface TransformerAppletOptions extends Pick<PresetAppletOptions, 'unsupportedChars'> {}
