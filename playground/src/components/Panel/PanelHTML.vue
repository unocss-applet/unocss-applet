<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { computed, unref } from 'vue'
import { annotations, customHTML, options, output, transformedHTML } from '~/composables/states'
import { defaultHTMLRaw } from '~/constants/index'
import MonacoEditor from '../MonacoEditor.vue'
import TitleBar from './TitleBar.vue'

import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()

if (!customHTML.value)
  customHTML.value = defaultHTMLRaw

const computedInputHTML = computed({
  get: () => unref(options.value.transformHtml ? transformedHTML : customHTML) || '',
  set: (value: string) => {
    customHTML.value = value
  },
})
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="HTML" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)">
      <label class="flex items-center gap-1">
        <input v-model="options.transformHtml" type="checkbox">
        <span text-sm>Transform</span>
      </label>
    </TitleBar>
    <MonacoEditor
      v-model="computedInputHTML" language="html" class="border-l border-gray-400/20 transition-all"
      :class="{ hidden: isCollapsed(0) }" :matched="output?.matched || new Set()" :annotations="annotations"
      :read-only="options.transformHtml"
    />
  </Pane>
</template>
