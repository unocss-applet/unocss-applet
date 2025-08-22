import { decompressFromEncodedURIComponent as decode, compressToEncodedURIComponent as encode } from 'lz-string'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defaultConfigRaw, defaultCSSRaw, defaultHTMLRaw, defaultOptions, STORAGE_KEY } from '~/constants'

interface Options {
  transformHtml?: boolean
  transformCustomCSS?: boolean
  prettifyCSS?: boolean
  selectedCSSLayers?: string[]
  responsive?: boolean
  width?: number
  height?: number
}

const params = new URLSearchParams(window.location.search || localStorage.getItem(STORAGE_KEY) || '')

export const useUrlStore = defineStore('url', () => {
  const customHTMLRaw = ref(decode(params.get('html') ?? '') || defaultHTMLRaw)
  const customConfigRaw = ref(decode(params.get('config') ?? '') || defaultConfigRaw)
  const customCSSRaw = ref(decode(params.get('css') ?? '') || defaultCSSRaw)
  const options = ref<Options>(JSON.parse(decode(params.get('options') ?? '') || defaultOptions))

  function updateUrlParams() {
    const url = new URL('/', window.location.origin)
    url.searchParams.set('html', encode(customHTMLRaw.value))
    url.searchParams.set('config', encode(customConfigRaw.value))
    url.searchParams.set('css', encode(customCSSRaw.value))
    url.searchParams.set('options', encode(JSON.stringify(options.value)))
    localStorage.setItem(STORAGE_KEY, url.search)
    window.history.replaceState('', '', `${url.pathname}${url.search}`)
  }

  function resetUrlParams() {
    customHTMLRaw.value = defaultHTMLRaw
    customConfigRaw.value = defaultConfigRaw
    customCSSRaw.value = defaultCSSRaw
    options.value = JSON.parse(defaultOptions)
  }

  return {
    customHTMLRaw,
    customConfigRaw,
    customCSSRaw,
    options,

    updateUrlParams,
    resetUrlParams,
  }
})
