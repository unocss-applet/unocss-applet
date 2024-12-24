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

function handleResize(event: ({ size: number })[]) {
  panelSizes.value = event.map(({ size }) => size)
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
  <div flex="~ col" h-full>
    <HeaderBar />
    <div flex-1 of-hidden>
      <Splitpanes ref="_panelEl" :class="{ loading }" horizontal @resized="handleResize">
        <PanelHTML :index="0" />
        <PanelConfig :index="1" />
        <PanelCustomCSS :index="2" />
        <PanelOutputCSS :index="3" />
      </Splitpanes>
    </div>
  </div>
</template>
