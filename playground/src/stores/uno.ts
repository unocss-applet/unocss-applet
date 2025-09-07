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
  const appletConfig = ref<UserConfig>()

  const customConfigError = ref<Error>()
  const customCSSWarn = ref<Error>()

  const customDefaultConfig = ref<UserConfig>()
  const customAppletConfig = ref<UserConfig>()

  const defaultUno = ref<Promise<UnoGenerator<object>>>()
  const appletUno = ref<Promise<UnoGenerator<object>>>()
  const autocomplete = ref<Promise<UnocssAutocomplete>>()

  async function initUno() {
    try {
      defaultConfig.value = await evaluateUserConfig(defaultConfigRaw)
      appletConfig.value = await evaluateUserConfig(defaultConfigRaw, true)

      defaultUno.value = createGenerator({}, defaultConfig.value)
      appletUno.value = createGenerator({}, appletConfig.value)
      autocomplete.value = Promise.resolve(createAutocomplete(await defaultUno.value))
      isLoadingUno.value = false
    }
    catch (e) {
      customConfigError.value = e as Error
    }
  }

  const transformedDefaultHTML = ref<{ output: string, annotations: HighlightAnnotation[] }>()
  const transformedAppletHTML = ref<{ output: string, annotations: HighlightAnnotation[] }>()

  const transformedDefaultCSS = ref<{ output: string, annotations: HighlightAnnotation[] }>()
  const transformedAppletCSS = ref<{ output: string, annotations: HighlightAnnotation[] }>()
  const generatedDefaultResult = shallowRef<GenerateResult>()
  const generatedAppletResult = shallowRef<GenerateResult>()

  return {
    hasGenerated,
    isLoadingUno,
    defaultConfig,
    appletConfig,
    customDefaultConfig,
    customAppletConfig,
    customConfigError,
    customCSSWarn,

    defaultUno,
    appletUno,
    autocomplete,

    transformedDefaultHTML,
    transformedAppletHTML,
    transformedDefaultCSS,
    transformedAppletCSS,

    generatedDefaultResult,
    generatedAppletResult,

    initUno,
  }
})
