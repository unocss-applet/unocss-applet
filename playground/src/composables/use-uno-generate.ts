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
    defaultUno,
    appletUno,
    autocomplete,
    customDefaultConfig,
    customAppletConfig,
    defaultConfig,
    customConfigError,
    customCSSWarn,
    generatedDefaultResult,
    generatedAppletResult,
    transformedDefaultHTML,
    transformedAppletHTML,
    transformedDefaultCSS,
    transformedAppletCSS,
  } = storeToRefs(useUnoStore())

  const { detectTransformer } = useUnoTransform()

  async function generate() {
    if (!defaultUno.value || !appletUno.value) {
      return
    }

    const _defaultUno = await defaultUno.value
    generatedDefaultResult.value = await _defaultUno.generate(transformedDefaultHTML.value?.output || '')

    const _appletUno = await appletUno.value
    generatedAppletResult.value = await _appletUno.generate(transformedAppletHTML.value?.output || '')
    hasGenerated.value = true
  }

  async function reGenerate() {
    if (!appletUno.value) {
      return
    }
    const uno = await appletUno.value
    customConfigError.value = undefined
    customCSSWarn.value = undefined
    try {
      const result = await evaluateUserConfig(customConfigRaw.value, true)
      if (result) {
        const preflights = (result.preflights ?? []).filter(p => p.layer !== CUSTOM_CSS_LAYER_NAME)
        preflights.push({
          layer: CUSTOM_CSS_LAYER_NAME,
          getCSS: () => cleanOutput(transformedAppletCSS.value?.output || ''),
        })
        result.preflights = preflights
        customAppletConfig.value = result

        await uno.setConfig(customAppletConfig.value, defaultConfig.value)
        await detectTransformer()
        generate()
        reGenerateDefault()
      }
    }
    catch (e) {
      console.error(e)
      customConfigError.value = e as Error
    }
  }

  async function reGenerateDefault() {
    if (!defaultUno.value) {
      return
    }
    const uno = await defaultUno.value
    const result = await evaluateUserConfig(customConfigRaw.value)
    if (result) {
      const preflights = (result.preflights ?? []).filter(p => p.layer !== CUSTOM_CSS_LAYER_NAME)
      preflights.push({
        layer: CUSTOM_CSS_LAYER_NAME,
        getCSS: () => cleanOutput(transformedDefaultCSS.value?.output || ''),
      })
      result.preflights = preflights
      customDefaultConfig.value = result
      await uno.setConfig(customDefaultConfig.value, defaultConfig.value)
      autocomplete.value = Promise.resolve(createAutocomplete(uno))
    }
  }

  return {
    generate,
    reGenerate,
  }
}
