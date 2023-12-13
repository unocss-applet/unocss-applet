<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { isDark } from '~/composables/dark'
import { init, output, transformedHTML } from '~/composables/uno'

const iframe = ref<HTMLIFrameElement>()
const iframeData = reactive({
  source: 'unocss-applet-playground',
  css: computed(() => output.value?.css || ''),
  html: transformedHTML,
  dark: isDark,
})

async function send() {
  iframe.value?.contentWindow?.postMessage(JSON.stringify(iframeData), location.origin)
}

watch([iframeData, iframe], send, { deep: true })
</script>

<template>
  <div class="h-full w-full overflow-hidden">
    <iframe
      v-show="init"
      ref="iframe"
      h-full w-full border-0 flex-grow min-w-0 min-h-0
      src="/__play.html"
      @load="send"
    />
  </div>
</template>
