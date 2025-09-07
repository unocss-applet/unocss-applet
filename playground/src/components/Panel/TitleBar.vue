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
    class="flex items-center justify-between min-h-30px max-h-30px cursor-pointer"
  >
    <div class="flex px-1 gap-1 items-center" @click="e => emit('titleClick', e)">
      <div
        class="transition-transform transform i-tabler-chevron-right"
        :class="isCollapsed ? '' : 'rotate-90'"
      />
      <div class="op-60 shrink-0">
        {{ title }}
      </div>
    </div>
    <div class="px-1">
      <slot />
    </div>
  </div>
</template>
