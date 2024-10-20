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
    border="l y main"
    text="gray/80"
    class="min-h-30px max-h-30px all:my-auto cursor-pointer"
    flex
  >
    <div class="flex px1 gap-1" @click="e => emit('titleClick', e)">
      <div
        class="flex-shrink-0 transition-transform transform"
        :class="isCollapsed ? 'i-tabler-chevron-right' : 'i-tabler-chevron-down'"
      />
      <div class="op-60 shrink-0">
        {{ title }}
      </div>
    </div>
    <div class="px1 flex flex-auto h-full gap-2">
      <slot />
    </div>
  </div>
</template>
