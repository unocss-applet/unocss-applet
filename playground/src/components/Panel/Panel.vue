<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { Splitpanes } from 'splitpanes'
import { watch } from 'vue'
import { usePanelStore } from '~/stores'
import HeaderBar from '../HeaderBar.vue'
import PanelConfig from './PanelConfig.vue'
import PanelCustomCSS from './PanelCustomCSS.vue'
import PanelHTML from './PanelHTML.vue'
import PanelOutputCSS from './PanelOutputCSS.vue'

const { panelEl, panelSizes, titleHeightPercent, collapsedPanels } = storeToRefs(usePanelStore())

watch(
  panelSizes,
  (value: number[]) => {
    value.forEach((height, idx) => {
      if (height > titleHeightPercent.value)
        collapsedPanels.value.delete(idx)
      else
        collapsedPanels.value.add(idx)
    })
  },
)

watch(
  titleHeightPercent,
  (value: number) => {
    const spareSpace = (100 - collapsedPanels.value.size * value - panelSizes.value
      .reduce(
        (unCollapsed, height, idx) => collapsedPanels.value.has(idx) ? unCollapsed : unCollapsed + height,
        0,
      )
    ) / (panelSizes.value.length - collapsedPanels.value.size)
    panelSizes.value = panelSizes.value.map((height, idx) => (height <= value || collapsedPanels.value.has(idx)) ? value : height + spareSpace)
  },
)

function handleResize({ panes }: { panes: { size: number }[] }) {
  panelSizes.value = panes.map(panel => panel.size)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <HeaderBar />
    <div class="flex-1 overflow-hidden">
      <Splitpanes ref="panelEl" horizontal @resized="handleResize">
        <PanelHTML :index="0" />
        <PanelConfig :index="1" />
        <PanelCustomCSS :index="2" />
        <PanelOutputCSS :index="3" />
      </Splitpanes>
    </div>
  </div>
</template>
