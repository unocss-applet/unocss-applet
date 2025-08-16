<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { computed, unref } from 'vue'
import { customCSS, customCSSWarn, options, transformedCSS } from '~/composables/states'
import MonacoEditor from '../MonacoEditor.vue'
import TitleBar from './TitleBar.vue'

import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()

const computedCustomCSS = computed({
  get: () => unref(options.value.transformCustomCSS ? transformedCSS : customCSS) || '',
  set: (value: string) => {
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
    <MonacoEditor
      v-model="computedCustomCSS" language="css" class="border-l border-gray-400/20 transition-all"
      :class="{ hidden: isCollapsed(2) }"
    />
    <div
      v-if="options.transformCustomCSS && customCSSWarn && WarnContent" class="absolute left-0 right-0 bottom-0"
      p="x-2 y-1" bg="yellow-400/20" text="yellow-400 sm" v-html="WarnContent"
    />
  </Pane>
</template>
