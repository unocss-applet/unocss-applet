<script setup lang="ts">
import { ref } from 'vue'
const bool = ref<boolean>()
</script>

<template>
  <div class="text-center aaa" p="4" text-blue>
    <div text="4xl" text-green un-p-2 ma />
    <div :class="`p-2.5 ${bool ? 'p-0.5' : ''}`" m-2 :hover-class="['!bg-green']" />
    <div flex="~ col gap-1" class="p-1" items-center />
    <div un-b="~ green" text-right h-10 text="!pink">
      123456789
    </div>
    <div un-b="~ green" class="text-purple">
      123456789
    </div>
    <div i-carbon:logo-twitter dark:i-carbon:logo-github />
    <div i-carbon-logo-twitter dark:i-carbon-logo-github />
  </div>
</template>
