<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { Pane } from 'splitpanes'
import { computed, unref } from 'vue'
import { usePanel } from '~/composables'
import { defaultHTMLRaw } from '~/constants'
import { usePanelStore, useUnoStore, useUrlStore } from '~/stores'

import { prettify } from '~/utils'
import MonacoEditor from '../MonacoEditor.vue'
import TitleBar from './TitleBar.vue'

defineProps<{ index: number }>()

const { panelSizes, titleHeightPercent } = storeToRefs(usePanelStore())
const { isCollapsed, togglePanel } = usePanel()

const { customHTMLRaw, options } = storeToRefs(useUrlStore())
const { transformedDefaultHTML, transformedAppletHTML, generatedDefaultResult, generatedAppletResult } = storeToRefs(useUnoStore())

const annotations = computed(() => transformedDefaultHTML.value?.annotations)

if (!customHTMLRaw.value)
  customHTMLRaw.value = defaultHTMLRaw

const computedInputHTML = computed({
  get: () => unref(options.value.transformHtml ? transformedAppletHTML.value?.output : customHTMLRaw) || '',
  set: async (value: string) => {
    if (options.value.transformHtml) {
      return
    }
    customHTMLRaw.value = value
  },
})

const computedMatched = computed(
  () => options.value.transformHtml ? generatedAppletResult.value?.matched : generatedDefaultResult.value?.matched,
)

async function prettifyHTML() {
  if (options.value.transformHtml) {
    return
  }
  customHTMLRaw.value = prettify(computedInputHTML.value, 'html')
}
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="HTML" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)">
      <div class="flex items-center gap-1">
        <label class="flex items-center gap-1">
          <input v-model="options.transformHtml" type="checkbox">
          <span text-sm>Transform</span>
        </label>
        <button class="i-tabler-mist" @click="prettifyHTML" />
      </div>
    </TitleBar>
    <MonacoEditor
      v-model="computedInputHTML" language="html" class="border-l border-gray-400/20 transition-all"
      :class="{ hidden: isCollapsed(0) }" :matched="computedMatched" :annotations="annotations"
      :readonly="options.transformHtml"
    />
  </Pane>
</template>
