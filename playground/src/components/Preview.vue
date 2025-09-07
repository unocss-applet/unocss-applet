<script lang="ts" setup>
import { debouncedWatch } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useUnoGenerate, useUnoTransform } from '~/composables'
import { isDark } from '~/composables/dark'

import { useUnoStore, useUrlStore } from '~/stores'

const { customHTMLRaw, customConfigRaw, customCSSRaw } = storeToRefs(useUrlStore())
const { hasGenerated, isLoadingUno, generatedAppletResult, transformedAppletHTML } = storeToRefs(useUnoStore())
const { initUno } = useUnoStore()

const { transformHTML, transformCSS } = useUnoTransform()
const { generate, reGenerate } = useUnoGenerate()

const iframe = ref<HTMLIFrameElement>()
const iframeData = reactive({
  source: 'unocss-applet-playground',
  css: computed(() => generatedAppletResult.value?.css || ''),
  html: computed(() => transformedAppletHTML.value?.output || ''),
  dark: isDark,
})

async function send() {
  iframe.value?.contentWindow?.postMessage(JSON.stringify(iframeData), location.origin)
}

watch([iframeData, iframe], send, { deep: true })

watch(isLoadingUno, async (v) => {
  if (v) {
    await initUno()
  }
  else {
    await transformHTML()
    await transformCSS()
    await generate()
  }
}, { immediate: true })

watch(
  customHTMLRaw,
  async () => {
    await transformHTML()
    await generate()
  },
)

debouncedWatch(
  [customConfigRaw, customCSSRaw],
  async () => {
    await reGenerate()
  },
  { debounce: 300 },
)
</script>

<template>
  <div class="h-full flex w-full items-center justify-center">
    <iframe
      v-show="!isLoadingUno && hasGenerated"
      ref="iframe"
      class="h-full border-0 min-w-0 min-h-0 w-full"
      src="/__play.html"
      @load="send"
    />
  </div>
</template>
