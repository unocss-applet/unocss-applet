<script setup lang="ts">
const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
const index = 1
const type = 'text'
const bool = true
</script>

<template>
  <div class="flex aaa flex-col justify-center items-center">
    <div text="4xl" class="rotate-180 i-carbon-campsite" :class="bg" />
    <div class="border bg-blue-200 px-2 transition-all bg-red-500 font-(light mono) ">
      <div class="hover:(!bg-gray-400 text-white font-medium)" text="#6f4">
        0123456789
      </div>
    </div>
    <div class="p-1" :class="bool ? 'text-yellow-500 px-2.5' : ''">
      {{ `index${index + 1}` }}
    </div>
    <div class="bg-green" flex="~ col gap-2">
      <div text-center w-10 h-10 flex="1" bg-red>
        1
      </div>
      <div w-10 h-10 flex="1">
        2
      </div>
    </div>
    <uni-easyinput />
    <div class="bg-[url(https://static.runoob.com/images/demo/demo3.jpg)]" w-20 h-10>
      bg-img
    </div>
    <div class="m-0.5 p-1 text-2xl" :class="bool ? '' : 'text-yellow-500 p-2.5'">
      abckefghijklmnopqrstuvwxyz
    </div>
  </div>
</template>
