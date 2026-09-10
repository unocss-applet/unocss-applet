import type { PresetWind3Options } from '@unocss/preset-wind3'
import type { PresetWind4Options } from '@unocss/preset-wind4'

export interface PresetAppletOptions {

  /**
   * 使用哪个上游预设
   * @see https://unocss.dev/presets/wind3
   * @see https://unocss.dev/presets/wind4
   * @default 'wind3'
   */
  preset?: 'wind3' | 'wind4'

  /**
   * 传给 wind3 / wind4 的选项
   * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind3/src/index.ts#L16 for `PresetWind3Options`
   * @see https://github.com/unocss/unocss/blob/main/packages-presets/preset-wind4/src/index.ts#L52 for `PresetWind4Options`
   */
  presetOptions?: PresetWind3Options | PresetWind4Options

  /**
   * 小程序不支持的额外字符，会合并进默认值
   * @default
   * ```
   * ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\', '"', '?', '*', '=']
   * ```
   */
  unsupportedChars?: string[]

  /**
   * Space Between / Divide Width 作用的元素列表
   * @default
   * ```
   * ['view', 'button', 'text', 'image']
   * ```
   */
  betweenElements?: string[]

  /**
   * 通配变体（`*:`）展开的目标元素列表——小程序没有通配选择器，只能逐个列出
   * @default
   * ```
   * ['view', 'button', 'text', 'image']
   * ```
   */
  wildcardElements?: string[]
}

export interface TransformerAppletOptions extends Pick<PresetAppletOptions, 'unsupportedChars'> {}
