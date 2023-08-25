<!-- eslint-disable @typescript-eslint/quotes -->
<script setup lang="ts">
import { ref } from 'vue'
import { menuList } from './data'

const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
const icon = "i-carbon:campsite"
const index = 1
const bool = ref<boolean>()
const border = ref(true)
const fixed = ref(true)
</script>

<template>
  <div class="text-center aaa" p="4">
    <div text="4xl" class="rotate-180 i-carbon-campsite" :class="bg" :hover-class="bool ? '' : '!bg-teal'" />
    <div :class="[border && 'u-border-top', fixed && 'u-tabbar--fixed']" />
    <div class="border bg-blue-200 font-light font-mono">
      <div class="!hover:bg-gray-600 hover:text-red hover:font-bold" text="#fff">
        hover bg-gray-600 text-red font-bold
      </div>
    </div>
    <div :class="`p-2.5 ${bool ? 'p-0.5' : 'text-amber'}`" m-2 :hover-class="['!bg-green']">
      hover bg-green
    </div>
    <div flex="~ col gap-1" class="p-1" items-center :class="bool ? 'text-yellow-500 px-2.5' : ''">
      <div :class="icon" inline-block color="blue" text="xl !red" />
      <div bg="green-(!200 800)">
        {{ `index${index + 1}` }}{{ `index` }}
      </div>
    </div>
    <div flex="~ col" b="~ solid green dark:(red 2)">
      <div text-right h-10 flex="1" text="red" :class="{ 'text-sm': index > 0 }">
        0123456789
      </div>
      <div
        h-10 flex="1" :class="[index > 1 ? '' : '']" text="blue dark:(red !bold)" :style="[index > 1 ? '' : '']"
        :type="index > 1"
      />
    </div>
    <div
      class="bg-[url(https://static.runoob.com/images/demo/demo2.jpg)]" w-40 h-20 ma un-color="red"
      bg="center cover"
    />
    <div class="p-1 text-2xl" m-2 :class="bool ? '' : 'text-yellow-500 p-2.5'">
      abckefghijklmnopqrstuvwxyz
    </div>
    <div flex="~" gap-2>
      <template v-for="menu, _idx of menuList" :key="_idx">
        <div class="[&>view]:last:text-red [&>view]:first:text-green [&>div]:last:text-red [&>div]:first:text-green">
          <div>{{ menu.name }}</div>
          <div :class="menu.icon" />
        </div>
      </template>
      <div>
        <div class="before:text-sm before:content-['english']" />
        <div class="before:text-sm before:content-['中文']" />
      </div>
    </div>
    <div class="gap-2 flex">
      <div class="flex-1 divide-y-1 divide-red divide-dashed border-red border-solid border-1">
        <div class="custom-div border-0">
          1
        </div>
        <div border-0>
          2
        </div>
      </div>
      <div class="flex-1 flex space-x-1">
        <div class="custom-div border-solid border-1 border-blue w-20">
          1
        </div>
        <div border-blue border-solid border-1 w-20>
          2
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-div {
  --at-apply: text-right text-red
}
</style>
