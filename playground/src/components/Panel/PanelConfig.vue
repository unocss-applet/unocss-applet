<script lang="ts" setup>
import { Pane } from 'splitpanes'
import { customConfigRaw } from '~/composables/url'
import { defaultConfigRaw } from '~/constants'
import CodeMirror from '../CodeMirror.vue'
import TitleBar from './TitleBar.vue'
import { isCollapsed, panelSizes, titleHeightPercent, togglePanel } from './use-panel'

defineProps<{ index: number }>()

if (!customConfigRaw.value)
  customConfigRaw.value = defaultConfigRaw
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="Config" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)" />
    <TitleBar title="Config" />
    <CodeMirror v-model="customConfigRaw" flex-auto mode="js" border="l gray-400/20" class="scrolls" />
  </Pane>
</template>
