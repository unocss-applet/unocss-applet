import { ref } from 'vue'
import type { UserConfig } from '@unocss/core'
import { evaluateUserConfig } from './uno-shared'
import { defaultConfigRaw } from '~/constants'

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
