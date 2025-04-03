import type { PresetWind3Options } from '@unocss/preset-wind3'

/**
 * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind3/src/index.ts#L16 for `PresetWind3Options`
 * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-mini/src/index.ts#L33 for `PresetMiniOptions`
 */
export interface PresetAppletOptions extends PresetWind3Options {
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
