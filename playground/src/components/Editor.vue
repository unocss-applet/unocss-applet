<script lang="ts" setup>
import { computed, unref } from 'vue'
import CodeMirror from './CodeMirror.vue'
import { customCSS, customConfigRaw, inputHTML, options } from '~/composables/url'
import { defaultConfigRaw, defaultHTML } from '~/constants'
import { annotations, customCSSWarn, getHint, output, transformedCSS, transformedHTML } from '~/composables/uno'

if (!inputHTML.value)
  inputHTML.value = defaultHTML

const computedInputHTML = computed({
  get: () => unref(options.value.transformHtml ? transformedHTML : inputHTML),
  set: (value) => {
    inputHTML.value = value
  },
})

if (!customConfigRaw.value)
  customConfigRaw.value = defaultConfigRaw

const computedCustomCSS = computed({
  get: () => unref(options.value.transformCustomCSS ? transformedCSS : customCSS),
  set: (value) => {
    customCSS.value = value
  },
})

const WarnContent = computed(() => {
  if (customCSSWarn.value) {
    const msg = customCSSWarn.value.message
    const match = msg.match(/^(.+)'(.+)'(.+)$/)
    if (match)
      return `Warning: ${match[1]}<a inline-block b="b dashed yellow4" href="https://unocss.dev/transformers/directives" target='_blank'>${match[2]}</a>${match[3]}`
  }
  return ''
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div>Editor</div>
    <div class="overflow-hidden flex-2/5 flex flex-col relative">
      <div>HTML</div>
      <CodeMirror
        v-model="computedInputHTML" flex-auto mode="html" class="scrolls border-l border-gray-400/20"
        :matched="output?.matched || new Set()" :annotations="annotations" :get-hint="getHint"
        :read-only="options.transformHtml"
      />
    </div>
    <div class="overflow-hidden flex-2/5 flex flex-col relative">
      <div>Config</div>
      <CodeMirror v-model="customConfigRaw" flex-auto mode="js" border="l gray-400/20" class="scrolls" />
    </div>
    <div class="overflow-hidden flex-1/5 flex flex-col relative">
      <div>Custom CSS</div>
      <CodeMirror
        v-model="computedCustomCSS" :read-only="options.transformCustomCSS" flex-auto mode="css" border="l
      gray-400/20" class="scrolls"
      />
      <div
        v-if="options.transformCustomCSS && customCSSWarn && WarnContent" class="absolute left-0 right-0 bottom-0"
        p="x-2 y-1" bg="yellow-400/20" text="yellow-400 sm" v-html="WarnContent"
      />
    </div>
  </div>
</template>
