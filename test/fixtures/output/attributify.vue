<script setup lang="ts">
import { ref } from 'vue'

const bool = ref<boolean>()
const c = 'text-red'
</script>

<template>
  <div class="text-center aaa p-2.5 text-blue" :class="c">
    <div  class="text-4xl ma text-green p-2"/>
    <div class="bg-pink dark:bg-yellow hover:bg-green">
      dark
    </div>
    <div :class="`p-2.5 ${bool ? 'p-0.5 m-0.5' : ''}`" :hover-class="['!bg-green']"  class="m-2"/>
    <div class="p-1 flex flex-col flex-gap-1 items-center text-#fff" />
    <div class="b b-green text-right h-10 !text-pink">
      123456789
    </div>
    <div class="text-purple b b-green" :hover-class="['!bg-green', bool ? '' : 'text-red']">
      123456789
    </div>
    <div  class="i-carbon:logo-twitter dark:i-carbon:logo-github"/>
    <div  class="i-carbon-logo-twitter dark:i-carbon-logo-github mt-2.5"/>
    <div class="[&>div]:w-10 text-red">
      <div block class="text-left">
        1
      </div>
      <div class="color-[#233] text-center">
        2
      </div>
      <div class="text-right">
        3
      </div>
    </div>
    <div class="size-10 size-20" />
  </div>
</template>
