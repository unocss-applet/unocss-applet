<!-- eslint-disable @typescript-eslint/quotes -->
<script setup lang="ts">
import { ref } from 'vue'
const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'

const icon = "i-carbon:campsite"
const bgIgnore = 'applet-ignore: bg-[hsl(2.7,81.9%,69.6%)]'
const index = 1
const customClass = 'text-red'
const bool = ref<boolean>()
</script>

<template>
  <div class="text-center aaa" p="4">
    <div text="4xl" class="rotate-180 i-carbon-campsite" :class="bg" />
    <div class="border bg-blue-200 font-(light mono) " :cc="customClass">
      <div class="hover:(!bg-gray-600 text-red font-bold)" text="#fff">
        {{ 'applet-ignore: hover:(!bg-gray-600 text-red font-bold)' }}
      </div>
    </div>
    <div :class="`p-2.5 ${bool ? 'p-0.5' : ''}`" m-2 :hover-class="['!bg-green']">
      class="hover:bg-green"
    </div>
    <div flex="~ col gap-1" class="p-1" items-center :class="bool ? 'text-yellow-500 px-2.5' : ''">
      <div :class="icon" inline-block color="blue" text="xl !red" />
      <div bg="green-(!200 800)">
        {{ `index${index + 1}` }}{{ `index` }}
      </div>
    </div>
    <div flex="~ col" un-b="~ green" :class="`bg-${bg}`">
      <div text-right h-10 flex="1" text="red" :class="{ 'text-sm': index > 0 }">
        0123456789
      </div>
      <div
        h-10 flex="1" :class="[index > 1 ? 'text' : '']"
        text="blue dark:(red !bold)" :style="[index > 1 ? '' : '']"
        :type="index > 1"
      >
        {{ bgIgnore }}
      </div>
    </div>
    <div class="bg-[url(https://static.runoob.com/images/demo/demo2.jpg)]" w-40 h-20 ma color="white" bg="center cover">
      {{ 'applet-ignore: bg-[url(https://static.runoob.com/images/demo/demo2.jpg)]' }}
    </div>
    <div class="m-0.5 p-1 text-2xl" :class="bool ? '' : 'text-yellow-500 p-2.5'">
      abckefghijklmnopqrstuvwxyz
    </div>
  </div>
</template>
