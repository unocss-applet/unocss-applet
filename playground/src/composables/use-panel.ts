import { storeToRefs } from 'pinia'
import { usePanelStore } from '~/stores'

export function usePanel() {
  const { panelSizes, titleHeightPercent, collapsedPanels } = storeToRefs(usePanelStore())

  function isCollapsed(idx: number) {
    return collapsedPanels.value.has(idx)
  }

  function togglePanel(idx: number) {
    if (collapsedPanels.value.has(idx)) {
      collapsedPanels.value.delete(idx)
    }
    else {
      collapsedPanels.value.add(idx)
      if (collapsedPanels.value.size === panelSizes.value.length)
        collapsedPanels.value.delete((idx + 1) % panelSizes.value.length)
    }
    normalizePanels()
  }

  function normalizePanels() {
    const height = (100 - collapsedPanels.value.size * titleHeightPercent.value) / (panelSizes.value.length - collapsedPanels.value.size)
    panelSizes.value = panelSizes.value.map((_, idx) => collapsedPanels.value.has(idx) ? titleHeightPercent.value : height)
  }

  return {
    isCollapsed,
    togglePanel,
    normalizePanels,
  }
}
