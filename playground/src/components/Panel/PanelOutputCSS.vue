<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { Pane } from 'splitpanes'
import { computed } from 'vue'
import { usePanel } from '~/composables'
import { usePanelStore, useUnoStore, useUrlStore } from '~/stores'
import { prettify } from '~/utils'

import MonacoEditor from '../MonacoEditor.vue'
import TitleBar from './TitleBar.vue'

defineProps<{ index: number }>()

const { panelSizes, titleHeightPercent } = storeToRefs(usePanelStore())
const { isCollapsed, togglePanel } = usePanel()

const { options } = storeToRefs(useUrlStore())
const { generateResult } = storeToRefs(useUnoStore())

const formattedCSS = computed({
  get: () => {
    const css = generateResult.value?.css || ''
    if (options.value.prettifyCSS) {
      return prettify(css, 'css')
    }
    return css
  },
  set: (value: string) => {
    return value
  },
})
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="Output CSS" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)" />
    <MonacoEditor
      v-model="formattedCSS" language="css" class="border-l border-gray-400/20 transition-all"
      :class="{ hidden: isCollapsed(3) }"
      readonly
    />
  </Pane>
</template>
