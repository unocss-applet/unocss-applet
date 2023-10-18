import { defineConfig as defineUnoCSSConfig } from 'unocss'
import type { Theme } from '@unocss/preset-uno'
import type { UserAppletConfig } from './types'

export function defineConfig<T extends object = Theme>(config: UserAppletConfig<T>) {
  // const appletConfig = config.applet

  // TODO: support uniapp and taro

  return defineUnoCSSConfig(config)
}
