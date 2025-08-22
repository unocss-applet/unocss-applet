import type { UnocssAutocomplete } from '@unocss/autocomplete'
import type { GenerateResult, HighlightAnnotation, UnoGenerator, UserConfig } from 'unocss'
import { createAutocomplete } from '@unocss/autocomplete'
import { defineStore } from 'pinia'
import { createGenerator } from 'unocss'
import { ref, shallowRef } from 'vue'
import { evaluateUserConfig } from '~/composables/uno-shared'
import { defaultConfigRaw } from '~/constants'

export const isCSSPrettify = ref(false)
export const selectedLayers = ref<string[]>(['ALL'])

export const useUnoStore = defineStore('uno', () => {
  /**
   * Weather is it the first time to generate
   */
  const hasGenerated = ref(false)

  const isLoadingUno = ref(true)

  const defaultConfig = ref<UserConfig>()

  const customConfigError = ref<Error>()
  const customCSSWarn = ref<Error>()
  const customConfig = ref<UserConfig>()

  const __uno = ref<Promise<UnoGenerator<object>>>()
  const __autocomplete = ref<Promise<UnocssAutocomplete>>()

  async function initUno() {
    try {
      defaultConfig.value = await evaluateUserConfig(defaultConfigRaw)
      const uno = createGenerator({}, defaultConfig.value)
      __uno.value = uno
      __autocomplete.value = Promise.resolve(createAutocomplete(await uno))
      isLoadingUno.value = false
    }
    catch (e) {
      customConfigError.value = e as Error
    }
  }

  const transformedHTML = ref<{ output: string, annotations: HighlightAnnotation[] }>()
  const transformedCSS = ref<{ output: string, annotations: HighlightAnnotation[] }>()
  const generateResult = shallowRef<GenerateResult>()

  return {
    hasGenerated,
    isLoadingUno,
    defaultConfig,
    customConfig,
    customConfigError,
    customCSSWarn,

    __uno,
    __autocomplete,

    generateResult,
    transformedHTML,
    transformedCSS,

    initUno,
  }
})
