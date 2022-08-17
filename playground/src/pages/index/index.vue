<script setup lang="ts">
const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
const index = 1
const type = 'text'
</script>

<template>
  <div class="flex aaa flex-col justify-center items-center">
    <div class="text-green-500 text-4xl rotate-180 i-carbon-campsite" :class="bg" />
    <div class="border bg-blue-200 px-2 transition-all bg-red-500 font-(light mono) ">
      <div class="text-green-200/50 hover:(!bg-gray-400 text-white font-medium)">
        0123456789
      </div>
    </div>
    <div class="p-1" :class="true ? 'text-yellow-500' : ''">
      {{ `index${index + 1}` }}
    </div>
    <div class="py-3.5 grid-cols-[0.7fr_repeat(7,1fr)]">
      py-4.5
    </div>
    <div :class="{ 'is-textarea-icon': type === 'textarea' }">
      uniapp
    </div>
    <div
      class="bg-[url(https://avatars.githubusercontent.com/u/40738594?s=40&v=4)]"
      :class="{ 'bg-[url(https://avatars.githubusercontent.com/u/40738594?s=40&v=4)]': type === 'textarea' }"
    >
      uniapp
    </div>
    <div class="m-0.5 p-1 text-2xl" :class="true ? '' : 'text-yellow-500 p-2.5'">
      abckefghijklmnopqrstuvwxyz
    </div>
  </div>
</template>
