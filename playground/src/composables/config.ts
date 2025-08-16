import type { UserConfig } from 'unocss'
import { ref } from 'vue'
import { defaultConfigRaw } from '~/constants'
import { evaluateUserConfig } from './uno-shared'

export function useConfig() {
  const config = ref<UserConfig | undefined>()

  async function load() {
    try {
      config.value = await evaluateUserConfig(defaultConfigRaw)
    }
    catch (e) {
      console.error(e)
    }
  }

  return {
    config,
    load,
  }
}
