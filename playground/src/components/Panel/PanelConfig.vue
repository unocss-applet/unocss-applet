<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { Pane } from 'splitpanes'
import { usePanel } from '~/composables'
import { defaultConfigRaw } from '~/constants'
import { usePanelStore, useUnoStore, useUrlStore } from '~/stores'

import MonacoEditor from '../MonacoEditor.vue'
import TitleBar from './TitleBar.vue'

defineProps<{ index: number }>()

const { panelSizes, titleHeightPercent } = storeToRefs(usePanelStore())
const { isCollapsed, togglePanel } = usePanel()

const { customConfigRaw } = storeToRefs(useUrlStore())
const { customConfigError } = storeToRefs(useUnoStore())

if (!customConfigRaw.value)
  customConfigRaw.value = defaultConfigRaw
</script>

<template>
  <Pane :min-size="titleHeightPercent" :size="panelSizes[index]" class="flex flex-col">
    <TitleBar title="Config" :is-collapsed="isCollapsed(index)" @title-click="togglePanel(index)" />
    <MonacoEditor
      v-model="customConfigRaw" language="javascript" class="border-l border-gray-400/20 transition-all"
      :class="{ hidden: isCollapsed(1) }"
    />
    <div
      v-if="!isCollapsed(index) && customConfigError"
      absolute
      left-0
      right-0
      bottom-0
      p="x-2 y-1"
      bg="red-400/20"
      text="red-400 sm"
    >
      {{ customConfigError.toString() }}
    </div>
  </Pane>
</template>
