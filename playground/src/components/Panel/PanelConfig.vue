<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { customConfig } from '~/composables/states'
import { defaultConfigRaw } from '~/constants'
import MonacoEditor from '../MonacoEditor.vue'
import TitleBar from './TitleBar.vue'
import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()

if (!customConfig.value)
  customConfig.value = defaultConfigRaw
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="Config" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)" />
    <MonacoEditor
      v-model="customConfig" language="javascript" class="border-l border-gray-400/20 transition-all"
      :class="{ hidden: isCollapsed(1) }"
    />
  </Pane>
</template>
