<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { computed, unref } from 'vue'
import { customCSSWarn, transformedCSS } from '~/composables/uno'
import { customCSS, options } from '~/composables/url'
import CodeMirror from '../CodeMirror.vue'
import TitleBar from './TitleBar.vue'
import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()

const computedCustomCSS = computed({
  get: () => unref(options.value.transformCustomCSS ? transformedCSS : customCSS),
  set: (value) => {
    customCSS.value = value
  },
})

const WarnContent = computed(() => {
  if (customCSSWarn.value) {
    const msg = customCSSWarn.value.message
    const match = msg.match(/^([^']+)'(.+)'([^']+)$/)
    if (match)
      return `Warning: ${match[1]}<a inline-block b="b dashed yellow4" href="https://unocss.dev/transformers/directives" target='_blank'>${match[2]}</a>${match[3]}`
  }
  return ''
})
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="Custom CSS" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)" />
    <CodeMirror
      v-model="computedCustomCSS" :read-only="options.transformCustomCSS" flex-auto mode="css" border="l gray-400/20" class="scrolls"
    />
    <div
      v-if="options.transformCustomCSS && customCSSWarn && WarnContent" class="absolute left-0 right-0 bottom-0"
      p="x-2 y-1" bg="yellow-400/20" text="yellow-400 sm" v-html="WarnContent"
    />
  </Pane>
</template>
