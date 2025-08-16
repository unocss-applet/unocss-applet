<script setup lang="ts">
defineProps<{
  title: string
  isCollapsed?: boolean
}>()

const emit = defineEmits<{
  (n: 'titleClick', e: any): void
}>()
</script>

<template>
  <div
    style="background-color: var(--cm-background)"
    border="l y gray-400/20"
    text="gray/80"
    class="flex items-center min-h-30px max-h-30px cursor-pointer"
  >
    <div class="flex px1 gap-1 items-center" @click="e => emit('titleClick', e)">
      <div
        class="flex-shrink-0 transition-transform transform"
        :class="isCollapsed ? 'i-tabler-chevron-right' : 'i-tabler-chevron-down'"
      />
      <div class="op-60 shrink-0">
        {{ title }}
      </div>
    </div>
    <div class="px1 flex flex-auto h-full gap-2 items-center">
      <slot />
    </div>
  </div>
</template>
