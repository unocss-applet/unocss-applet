<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { Pane } from 'splitpanes'
import { computed, unref } from 'vue'
import { useUnoTransform } from '~/composables'
import { defaultHTMLRaw } from '~/constants/index'
import { useUnoStore, useUrlStore } from '~/stores'
import MonacoEditor from '../MonacoEditor.vue'

import TitleBar from './TitleBar.vue'
import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()

const { customHTMLRaw, options } = storeToRefs(useUrlStore())
const { transformedHTML, generateResult } = storeToRefs(useUnoStore())

const annotations = computed(() => transformedHTML.value?.annotations)

const { transformHTML } = useUnoTransform()

if (!customHTMLRaw.value)
  customHTMLRaw.value = defaultHTMLRaw

const computedInputHTML = computed({
  get: () => unref(options.value.transformHtml ? transformedHTML.value?.output : customHTMLRaw) || '',
  set: async (value: string) => {
    if (options.value.transformHtml) {
      return
    }
    customHTMLRaw.value = value
    await transformHTML()
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
      :class="{ hidden: isCollapsed(0) }" :matched="generateResult?.matched || new Set()" :annotations="annotations"
      :readonly="options.transformHtml"
    />
  </Pane>
</template>
