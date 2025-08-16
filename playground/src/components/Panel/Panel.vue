<script lang="ts" setup>
import { Splitpanes } from 'splitpanes'
import { onMounted, ref } from 'vue'
import HeaderBar from '../HeaderBar.vue'
import PanelConfig from './PanelConfig.vue'
import PanelCustomCSS from './PanelCustomCSS.vue'
import PanelHTML from './PanelHTML.vue'
import PanelOutputCSS from './PanelOutputCSS.vue'
import { panelEl, panelSizes } from './use-panel'

const loading = ref(true)

function handleResize({ panes }: { panes: { size: number }[] }) {
  panelSizes.value = panes.map(panel => panel.size)
}

onMounted(() => {
  // prevent init transition
  setTimeout(() => {
    loading.value = false
  }, 200)
})

const _panelEl = ref(panelEl)
</script>

<template>
  <div class="flex flex-col h-full">
    <HeaderBar />
    <div class="flex-1 overflow-hidden">
      <Splitpanes ref="_panelEl" :class="{ loading }" horizontal @resized="handleResize">
        <PanelHTML :index="0" />
        <PanelConfig :index="1" />
        <PanelCustomCSS :index="2" />
        <PanelOutputCSS :index="3" />
      </Splitpanes>
    </div>
  </div>
</template>
