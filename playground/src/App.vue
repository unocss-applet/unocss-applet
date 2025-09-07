<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { Pane, Splitpanes } from 'splitpanes'
import { ref } from 'vue'
import Panel from './components/Panel/Panel.vue'
import Preview from './components/Preview.vue'

const bp = useBreakpoints(breakpointsTailwind)

const isMobile = bp.smaller('sm')
const isResizing = ref(false)
</script>

<template>
  <Splitpanes
    class="h-screen w-screen"
    :horizontal="isMobile"
    @resized="isResizing = false"
    @resize="isResizing = true"
  >
    <Pane :size="isMobile ? 50 : 40">
      <Preview />
    </Pane>
    <Pane :size="isMobile ? 50 : 60">
      <Panel />
    </Pane>
  </Splitpanes>
</template>
