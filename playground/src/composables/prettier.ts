import { computed, ref } from 'vue'
import { output, transformedCSS, transformedHTML } from './uno'
import { customConfigRaw, customCSS, inputHTML, options } from './url'
import { useCSSPrettify, useHTMLPrettify, useJSPrettify } from './usePrettify'

export function formatHTML() {
  inputHTML.value = useHTMLPrettify(options.value.transformHtml ? transformedHTML : inputHTML).value
}

export function formatConfig() {
  customConfigRaw.value = useJSPrettify(customConfigRaw).value
}

export function formatCSS() {
  customCSS.value = useCSSPrettify(options.value.transformCustomCSS ? transformedCSS : customCSS).value
}

export const showPreflights = ref(false)
export const isCSSPrettify = ref(false)
export const cssFormatted = useCSSPrettify(
  computed(() => output.value?.getLayers(undefined, showPreflights.value
    ? undefined
    : ['preflights'])),
  isCSSPrettify,
)
