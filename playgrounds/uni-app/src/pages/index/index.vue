<!-- eslint-disable @typescript-eslint/quotes -->
<script setup lang="ts">
import { ref } from 'vue'
import AButton from 'ano-ui/components/AButton/AButton.vue'
import ASwitch from 'ano-ui/components/ASwitch/ASwitch.vue'
import { menuList } from './data'

const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
const icon = "i-carbon:campsite"
const bgIgnore = 'applet-ignore bg-[hsl(2.7,81.9%,69.6%)]'
const index = 1
const bool = ref<boolean>()
const border = ref(true)
const fixed = ref(true)
</script>

<template>
  <div class="text-center aaa" p="4">
    <div text="4xl" class="rotate-180 i-carbon-campsite" :class="bg" :hover-class="bool ? '' : '!bg-teal'" />
    <div :class="[border && 'u-border-top', fixed && 'u-tabbar--fixed']" />
    <div class="border bg-blue-200 font-(light mono) ">
      <div class="hover:(!bg-gray-600 text-red font-bold)" text="#fff">
        {{ 'applet-ignore hover:(!bg-gray-600 text-red font-bold)' }}
      </div>
    </div>
    <div :class="`p-2.5 ${bool ? 'p-0.5' : 'text-amber'}`" m-2 :hover-class="['!bg-green']">
      class="applet-ignore hover:bg-green"
    </div>
    <div class="flex gap-2">
      <AButton>Button</AButton>
      <ASwitch v-model="bool" />
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
      >
        {{ bgIgnore }}
      </div>
    </div>
    <div class="bg-[url(https://static.runoob.com/images/demo/demo2.jpg)]" w-40 h-20 ma un-color="red" bg="center cover">
      {{ 'applet-ignore bg-[url(https://static.runoob.com/images/demo/demo2.jpg)]' }}
    </div>
    <div class="p-1 text-2xl" m-2 :class="bool ? '' : 'text-yellow-500 p-2.5'">
      abckefghijklmnopqrstuvwxyz
    </div>
    <div i-carbon:logo-twitter dark:i-carbon:logo-github />
    <div i-carbon-logo-twitter dark:i-carbon-logo-github />
    <div flex="~" gap-2>
      <template v-for="menu, _idx of menuList" :key="_idx">
        <div class="[&>view]:last:text-red [&>view]:first:text-green [&+view]:text-2xl [&>div]:last:text-red [&>div]:first:text-green [&+div]:text-2xl">
          <div>{{ menu.name }}</div>
          <div :class="menu.icon" />
        </div>
      </template>
    </div>
    <div>
      before:content-test
      <div class="before:content-['english']" />
      <div class="before:content-['中文']" />
    </div>
  </div>
</template>

<style scoped></style>
