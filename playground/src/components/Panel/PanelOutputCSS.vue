<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { cssFormatted } from '~/composables/states'
import MonacoEditor from '../MonacoEditor.vue'
import TitleBar from './TitleBar.vue'
import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="Output CSS" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)" />
    <MonacoEditor
      v-model="cssFormatted" language="css" class="border-l border-gray-400/20 transition-all"
      :class="{ hidden: isCollapsed(3) }"
    />
  </Pane>
</template>
