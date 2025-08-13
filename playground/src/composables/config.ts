import type { UserConfig } from 'unocss'
import { ref } from 'vue'
import { defaultConfigRaw } from '~/constants'
import { evaluateUserConfig } from './uno-shared'

export const defaultConfig = ref<UserConfig | undefined>()

export async function load() {
  try {
    defaultConfig.value = await evaluateUserConfig(defaultConfigRaw)
  }
  catch (e) {
    console.error(e)
  }
}

load()
