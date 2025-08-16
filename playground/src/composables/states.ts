import type { GenerateResult, HighlightAnnotation } from 'unocss'
import type { UserConfig } from 'vite'
import { decompressFromEncodedURIComponent as decode, compressToEncodedURIComponent as encode } from 'lz-string'
import { computed, ref, shallowRef } from 'vue'
import { defaultConfigRaw, defaultCSSRaw, defaultHTMLRaw, defaultOptions, STORAGE_KEY } from '~/constants'
import { evaluateUserConfig } from './uno-shared'
import { useCSSPrettify, useHTMLPrettify, useJSPrettify } from './use-prettify'

interface Options {
  transformHtml?: boolean
  transformCustomCSS?: boolean
  responsive?: boolean
  width?: number
  height?: number
}

const params = new URLSearchParams(window.location.search || localStorage.getItem(STORAGE_KEY) || '')

export const customHTML = ref(decode(params.get('html') || '') || defaultHTMLRaw)
export const customConfig = ref(decode(params.get('config') || '') || defaultConfigRaw)
export const customCSS = ref(decode(params.get('css') || '') || defaultCSSRaw)
export const options = ref<Options>(JSON.parse(decode(params.get('options') || '') || defaultOptions))

export const init = ref(false)
export const customConfigError = ref<Error>()
export const customCSSWarn = ref<Error>()
export const config = ref<UserConfig | undefined>()
export const output = shallowRef<GenerateResult>()
export const annotations = shallowRef<HighlightAnnotation[]>()
export const transformedHTML = ref<string>()
export const transformedCSS = ref<string>()

export const isCSSPrettify = ref(false)
export const selectedLayers = ref<string[]>(['ALL'])
export const cssFormatted = useCSSPrettify(
  computed(() => selectedLayers.value.includes('ALL') ? output.value?.css : output.value?.getLayers(selectedLayers.value)),
  isCSSPrettify,
)

export function formatHTML() {
  customHTML.value = useHTMLPrettify(options.value.transformHtml ? transformedHTML : customHTML).value
}

export function formatConfig() {
  customConfig.value = useJSPrettify(customConfig).value
}

export function formatCSS() {
  customCSS.value = useCSSPrettify(options.value.transformCustomCSS ? transformedCSS : customCSS).value
}

export function updateCustom() {
  const url = new URL('/', window.location.origin)
  url.searchParams.set('html', encode(customHTML.value))
  url.searchParams.set('config', encode(customConfig.value))
  url.searchParams.set('css', encode(customCSS.value))
  url.searchParams.set('options', encode(JSON.stringify(options.value)))
  localStorage.setItem(STORAGE_KEY, url.search)
  window.history.replaceState('', '', `${url.pathname}${url.search}`)
}

export function resetCustom() {
  customHTML.value = defaultHTMLRaw
  customConfig.value = defaultConfigRaw
  options.value.transformHtml = false
  customCSS.value = defaultCSSRaw
}

export async function loadConfig() {
  try {
    config.value = await evaluateUserConfig(defaultConfigRaw)
  }
  catch (e) {
    console.error(e)
  }
}
