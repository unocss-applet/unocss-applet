import { useElementSize, useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const TITLE_HEIGHT = 30

function getInitialPanelSizes(percent: number): number[] {
  return [
    100 - percent * 3,
    percent,
    percent,
    percent,
  ]
}

export const usePanelStore = defineStore('panel', () => {
  const panelEl = ref()

  const { height: vh } = useElementSize(panelEl)

  const titleHeightPercent = computed(() => {
    if (!vh.value)
      return 0
    return TITLE_HEIGHT / vh.value * 100
  })

  const collapsedPanels = ref(new Set([2]))

  const panelSizes = useLocalStorage<number[]>(
    'unocss-applet-panel-sizes',
    getInitialPanelSizes(titleHeightPercent.value),
    { listenToStorageChanges: false },
  )

  return {
    panelEl,
    panelSizes,
    titleHeightPercent,
    collapsedPanels,
  }
})
