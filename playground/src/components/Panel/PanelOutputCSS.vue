<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { cssFormatted } from '~/composables/prettier'
import CodeMirror from '../CodeMirror.vue'
import TitleBar from './TitleBar.vue'
import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="Output CSS" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)" />
    <CodeMirror
      :model-value="cssFormatted" flex-auto mode="css" border="l gray-400/20" class="scrolls"
      :read-only="true"
    />
  </Pane>
</template>
