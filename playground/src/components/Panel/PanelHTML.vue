<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { computed, unref } from 'vue'
import { annotations, getHint, output, transformedHTML } from '~/composables/uno'
import { inputHTML, options } from '~/composables/url'
import { defaultHTML } from '~/constants'
import CodeMirror from '../CodeMirror.vue'
import TitleBar from './TitleBar.vue'
import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()

if (!inputHTML.value)
  inputHTML.value = defaultHTML

const computedInputHTML = computed({
  get: () => unref(options.value.transformHtml ? transformedHTML : inputHTML),
  set: (value) => {
    inputHTML.value = value
  },
})
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="HTML" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)">
      <label>
        <input v-model="options.transformHtml" type="checkbox">
        <span text-sm>Transform</span>
      </label>
    </TitleBar>
    <CodeMirror
      v-model="computedInputHTML" mode="html" class="scrolls border-l border-gray-400/20 transition-all" :class="{ hidden: isCollapsed(1) }"
      :matched="output?.matched || new Set()" :annotations="annotations" :get-hint="getHint"
      :read-only="options.transformHtml"
    />
  </Pane>
</template>
