<script setup lang="ts">
import Preview from './components/Preview.vue'
</script>

<template>
  <div class="font-sans leading-1em">
    <Splitpanes
      h-screen
      w-screen
      :horizontal="isMobile"
      @resized="isResizing = false"
      @resize="isResizing = true"
    >
      <Pane>
        <Preview />
      </Pane>
      <Pane>
        <Panel />
      </Pane>
    </Splitpanes>
  </div>
</template>
