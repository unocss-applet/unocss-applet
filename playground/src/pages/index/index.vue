<script setup lang="ts">
import { ref } from 'vue'
const title = ref('Hello')
</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <div class="text-green-500 text-4xl rotate-180 i-carbon-campsite" />
    <div class="border bg-blue-200 px-2 transition-all !bg-red-500">
      <div class="text-green-200/50">
        0123456789
      </div>
    </div>
    <div class="p-1" :class="true ? 'text-yellow-500' : ''">
      abckefghijklmnopqrstuvwxyz
    </div>
    <div class="bg-[hsl(2.7,81.9%,69.6%)] py-3.5 grid-cols-[0.7fr_repeat(7,1fr)]">
      py-3.5
    </div>
    <div hover-class="text-green-500/50">
      uniapp
    </div>
    <div class="m-0.5 p-1 text-2xl" :class="true ? '' : 'text-yellow-500 p-2.5'">
      abckefghijklmnopqrstuvwxyz
    </div>
  </div>
</template>

<style>
</style>
