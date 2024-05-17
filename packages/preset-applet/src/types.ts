import type { PresetUnoOptions } from '@unocss/preset-uno'

// PresetUnoOptions https://github.com/unocss/unocss/blob/main/packages/preset-uno/src/index.ts#L9
// PresetMiniOptions https://github.com/unocss/unocss/blob/main/packages/preset-mini/src/index.ts#L33-L73
export interface PresetAppletOptions extends PresetUnoOptions {
  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\', '"', '?', '*']
   */
  unsupportedChars?: string[]

  /**
   * Space Between and Divide Width Elements
   * @default ['view', 'button', 'text', 'image']
   */
  betweenElements?: string[]

  /**
   * Space Between and Divide Width Elements
   * @default ['view', 'button', 'text', 'image']
   */
  wildcardElements?: string[]
}
