<script setup lang="ts">
import { ref } from 'vue'

const bool = ref<boolean>()
const c = 'text-red'
</script>

<template>
  <div class="text-center aaa" p="2.5" text-blue :class="c">
    <div text="4xl" ma text-green un-p-2 />
    <div :class="`p-2.5 ${bool ? 'p-0.5 m-0.5' : ''}`" m-2 :hover-class="['!bg-green']" />
    <div flex="~ col gap-1" class="p-1" items-center />
    <div un-b="~ green" text-right h-10 text="!pink">
      123456789
    </div>
    <div un-b="~ green" class="text-purple" :hover-class="['!bg-green', bool ? '' : 'text-red']">
      123456789
    </div>
    <div i-carbon:logo-twitter dark:i-carbon:logo-github />
    <div i-carbon-logo-twitter dark:i-carbon-logo-github mt-2.5 />
    <div class="[&>div]:w-10" text-red>
      <div text-left block>
        1
      </div>
      <div text-center class="color-[#233]">
        2
      </div>
      <div text-right>
        3
      </div>
    </div>
    <div class="size-10" size="20" />
  </div>
</template>
