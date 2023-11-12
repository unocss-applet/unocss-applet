import type { UserConfig } from 'unocss'

export interface AppletConfig {
  /**
   * Platform
   * @default 'uniapp'
   */
  platform?: 'uniapp' | 'taro'

  /**
   * Unsupported characters in applet, will be added to the default value
   * @default ['.', ':', '%', '!', '#', '(', ')', '[', '/', ']', ',', '$', '{', '}', '@', '+', '^', '&', '<', '>', '\'', '\\']
   */
  unsupportedChars?: string[]

  /**
   * Space Between and Divide Width Elements
   * @default ['view', 'button', 'text', 'image']
   */
  betweenElements?: string[]
}

export type UserAppletConfig<Theme extends object = object> = UserConfig<Theme> & { applet?: AppletConfig }
