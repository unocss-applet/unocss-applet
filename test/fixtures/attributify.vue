<script setup lang="ts">
const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
const index = 1
const type = 'text'
const bool = true
</script>

<template>
  <div h-80 text-center flex flex-col align-center select-none all:transition-400>
    <!-- comment -->
    <input type="checkbox" peer mt-a>
    <div text="green-500 4xl" class="rotate-180 i-carbon-campsite" :class="bool ? bg : ''" />
    <button ref="sss" btn-block h-10 w-10 bg-blue block hhh>
      Button
    </button>
    <div class="p-1 [&>*]:border-gray/50" :class="bool ? 'text-yellow-500' : ''">
      {{ `index${+1}` }}
    </div>
    <div class="[&>*]:border-gray/50">
      <div>a</div>
      <div>b</div>
    </div>
    <div i-carbon-campsite inline-block color="blue" />
    <div mb-a block group peer-checked="text-4xl">
      <div
        font-100 text-4xl mb--3 p-10
        bg-gradient="to-r from-yellow-400 via-red-500 to-pink-500"
      >
        ~
      </div>
      <div text-5xl font-100 sm="bg-blue-600" bg="base" color="base">
        unocss
      </div>
      <div op-20 font-200 mt-1 tracking-wider group-hover="text-teal-400 op-50">
        Re-imaging Atomic CSS
      </div>
    </div>
  </div>
  <div flex>
    <div ma inline-flex relative h-14>
      <input type="text" m-0 pt-4 px-4 text-true-gray-800 peer placeholder="unocss" un-placeholder="text-red">
      <label
        absolute leading-1rem left-4 pointer-events-none text-gray-7 top="1/3" transition="200 linear"
        peer-not-placeholder-shown="-translate-y-4 scale-75 origin-top-left text-green-500"
        peer-focus="-translate-y-4 scale-75 origin-top-left text-green-500"
        before="content-!"
        after="content-[!]"
      >Experience now</label>
    </div>
  </div>
</template>
