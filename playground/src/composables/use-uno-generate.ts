import { createAutocomplete } from '@unocss/autocomplete'
import { storeToRefs } from 'pinia'
import { CUSTOM_CSS_LAYER_NAME } from '~/constants'
import { useUnoStore, useUrlStore } from '~/stores'
import { evaluateUserConfig } from './uno-shared'
import { cleanOutput, useUnoTransform } from './use-uno-transform'

export function useUnoGenerate() {
  const { customConfigRaw } = storeToRefs(useUrlStore())
  const {
    hasGenerated,
    __uno,
    __autocomplete,
    customConfig,
    defaultConfig,
    customConfigError,
    customCSSWarn,
    generateResult,
    transformedHTML,
    transformedCSS,
  } = storeToRefs(useUnoStore())

  const { detectTransformer } = useUnoTransform()

  async function generate() {
    if (!__uno.value) {
      return
    }
    const uno = await __uno.value
    generateResult.value = await uno.generate(transformedHTML.value?.output || '')
    hasGenerated.value = true
  }

  async function reGenerate() {
    if (!__uno.value) {
      return
    }
    const uno = await __uno.value
    customConfigError.value = undefined
    customCSSWarn.value = undefined
    try {
      const result = await evaluateUserConfig(customConfigRaw.value)
      if (result) {
        const preflights = (result.preflights ?? []).filter(p => p.layer !== CUSTOM_CSS_LAYER_NAME)
        preflights.push({
          layer: CUSTOM_CSS_LAYER_NAME,
          getCSS: () => cleanOutput(transformedCSS.value?.output || ''),
        })
        result.preflights = preflights
        customConfig.value = result

        await uno.setConfig(customConfig.value, defaultConfig.value)
        await detectTransformer()
        generate()
        __autocomplete.value = Promise.resolve(createAutocomplete(uno))
      }
    }
    catch (e) {
      console.error(e)
      customConfigError.value = e as Error
    }
  }

  return {
    generate,
    reGenerate,
  }
}
