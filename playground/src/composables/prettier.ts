import { computed, ref } from 'vue'
import { useCSSPrettify, useHTMLPrettify, useJSPrettify } from './usePrettify'
import { output, transformedCSS, transformedHTML } from './uno'
import { customCSS, customConfigRaw, inputHTML, options } from './url'

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
