<script setup lang="ts">
import { computed } from 'vue'

interface AButtonProps {
  cc?: string
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  icon?: string
}

const props = withDefaults(defineProps<AButtonProps>(), {
  type: 'primary',
  size: 'xs',
  loading: false,
  disabled: false,
  icon: '',
})

const isDisabled = computed(() => props.loading || props.disabled)
</script>

<template>
  <button class="a-button-base" :class="[cc, `!bg-red bg-${props.type}`]" hover-class="a-button-hover">
    <div v-if="icon" :class="icon" />
    <slot />
  </button>
</template>

<style scoped>

</style>

