<script setup lang="ts">
const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
const index = 1
const type = 'text'
const bool = true
</script>

<template>
  <div class="flex aaa flex-col justify-center items-center">
    <div text="green-500 4xl" class="rotate-180 i-carbon-campsite" :class="bool ? bg : ''" />
    <div class="border bg-blue-200 px-2 transition-all bg-red-500 font-(light mono)" h20>
      <div class="text-green-200/50 hover:(!bg-gray-400 text-white font-medium)">
        0123456789
      </div>
    </div>
    <div class="p-1" :class="bool ? 'text-yellow-500' : ''">
      {{ `index${index + 1}` }}
    </div>
    <div class="grid-cols-[0.7fr_repeat(7,1fr)]" flex="~ col">
      <div w-10 h-10 flex="1">
        1
      </div>
      <div w-10 h-10 flex="1">
        2
      </div>
    </div>

    <button />
    <div class="m-0.5 p-1 text-2xl" :class="bool ? '' : 'text-yellow-500 p-2.5'">
      abckefghijklmnopqrstuvwxyz
    </div>
  </div>
</template>
