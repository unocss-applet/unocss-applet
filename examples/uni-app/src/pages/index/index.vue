<script setup lang="ts">
import { ref } from 'vue'
import { menuList } from './data'

const active = ref(false)
const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'
const icon = 'i-carbon:campsite'
const steps = [1, 2]
const fractionLabel = ['w-1', '2'].join(String.fromCharCode(47))
const decimalLabel = ['w-1', '2'].join(String.fromCharCode(46))
</script>

<template>
  <view class="mx-auto box-border max-w-[720px] bg-white px-[20px] pt-[24px] pb-[40px] text-[14px] text-[#24332d] leading-[1.65]">
    <view class="text-[25px] font-bold leading-[1.3]">UnoCSS Playground</view>
    <view class="mt-[10px] text-[#52615a]">uni-app · 对照预期检查样式，按住或点击交互区域。</view>

    <view class="mt-[28px] border-t-[1px] border-[#dce4df] border-t-solid pt-[22px]">
      <view class="text-[18px] font-bold">分数与小数</view>
      <view class="mt-[7px] mb-[16px] text-[#52615a]">预期：绿色条占轨道一半，橙色条是一条细线，两者宽度不同。</view>
      <view class="mt-[14px] mb-[7px] text-[12px] text-[#52615a]">{{ fractionLabel }} · 50%</view>
      <view class="overflow-hidden bg-[#edf1ee]"><view class="w-1/2 h-6 bg-emerald-600" /></view>
      <view class="mt-[14px] mb-[7px] text-[12px] text-[#52615a]">{{ decimalLabel }} · 0.3rem 对应的长度</view>
      <view class="overflow-hidden bg-[#edf1ee]"><view class="w-1.2 h-6 bg-orange-600" /></view>
    </view>

    <view class="mt-[28px] border-t-[1px] border-[#dce4df] border-t-solid pt-[22px]">
      <view class="text-[18px] font-bold">按压反馈</view>
      <view class="mt-[7px] mb-[16px] text-[#52615a]">预期：按住后背景变深、文字变红加粗，松开恢复。H5 用鼠标悬停。</view>
      <view class="box-border flex min-h-[56px] items-center justify-center rounded-[8px] bg-blue-100 px-[16px] py-[12px] text-slate-800 hover:text-red-700 hover:font-bold !hover:bg-gray-200">按住这里检查样式</view>
      <view class="mt-[14px] mb-[7px] text-[12px] text-[#52615a]">原生 hover-class · 按住变绿</view>
      <view class="box-border flex min-h-[56px] items-center justify-center rounded-[8px] bg-slate-100 px-[16px] py-[12px]" hover-class="!bg-green-200">按住这里检查原生按压态</view>
    </view>

    <view class="mt-[28px] border-t-[1px] border-[#dce4df] border-t-solid pt-[22px]">
      <view class="text-[18px] font-bold">动态类名</view>
      <view class="mt-[7px] mb-[16px] text-[#52615a]">预期：点击切换后，状态文字、背景和内边距一起变化。</view>
      <button class="m-0 box-border block w-full cursor-pointer rounded-[8px] border-[1px] border-[#376c53] border-solid bg-white px-[16px] py-[12px] text-center text-[14px] text-[#24573f] leading-[1.65] after:border-0" @click="active = !active">{{ active ? '切回默认状态' : '切换到选中状态' }}</button>
      <view class="mt-[14px]" :class="`p-2.5 ${active ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}`">
        {{ active ? '选中状态 · 绿色' : '默认状态 · 琥珀色' }}
        <view :class="[active ? 'p-0.5' : 'p-2.5', { 'font-bold': active }]">{{ active ? '小内边距、粗体' : '大内边距、常规字重' }} · 数组读取 {{ steps[1] }}</view>
      </view>
    </view>

    <view class="mt-[28px] border-t-[1px] border-[#dce4df] border-t-solid pt-[22px]">
      <view class="text-[18px] font-bold">属性与变体组</view>
      <view class="mt-[7px] mb-[16px] text-[#52615a]">预期：内容纵向排列，有间距；右对齐文字为红色。深色模式下边框变红、加粗。</view>
      <view flex="~ col gap-2" b="~ solid green dark:(red 2)" p="3">
        <view bg="green-200" p="2">属性写法 · 浅绿背景</view>
        <view text="right red" class="font-mono" :class="{ 'text-sm': steps[1] > 0 }">右对齐 · 红色文字</view>
        <view text="blue dark:(red !bold)">浅色蓝字 / 深色红色粗体</view>
      </view>
    </view>

    <view class="mt-[28px] border-t-[1px] border-[#dce4df] border-t-solid pt-[22px]">
      <view class="text-[18px] font-bold">子选择器与间距</view>
      <view class="mt-[7px] mb-[16px] text-[#52615a]">预期：名称绿色、图标红色；下方两行之间有红色虚线，两个方块之间有间距。</view>
      <view class="flex gap-4">
        <view v-for="menu in menuList" :key="menu.name" class="[&>view]:first:text-green-700 [&>view]:last:text-red-700 [&>uni-view]:first:text-green-700 [&>uni-view]:last:text-red-700">
          <view>{{ menu.name }}</view><view :class="menu.icon" class="text-2xl" />
        </view>
      </view>
      <view class="mt-[14px] flex gap-3">
        <view class="flex-1 border-red-600 border-solid divide-y-1 divide-red-600 divide-dashed">
          <view class="custom-div p-2">第一行 · 右对齐红字</view><view class="p-2">第二行</view>
        </view>
        <view class="flex space-x-1">
          <view class="w-8 h-10 border-1 border-blue-600 border-solid text-center">A</view>
          <view class="w-8 h-10 border-1 border-blue-600 border-solid text-center">B</view>
        </view>
      </view>
    </view>

    <view class="mt-[28px] border-t-[1px] border-[#dce4df] border-t-solid pt-[22px]">
      <view class="text-[18px] font-bold">本地资源与任意值</view>
      <view class="mt-[7px] mb-[16px] text-[#52615a]">预期：本地 logo、倒置胡萝卜、蓝色营地图标都可见；色块为珊瑚色。</view>
      <view class="flex items-center gap-4">
        <image src="/static/logo.png" class="h-10 w-10" mode="aspectFit" />
        <view class="i-tabler-carrot rotate-180 text-4xl text-orange-600" />
        <view :class="icon" class="inline-block text-3xl text-blue-700" />
        <view :class="bg" class="h-10 w-10" />
      </view>
      <view class="mt-[14px] mb-[7px] text-[12px] text-[#52615a]">内嵌背景图片 · 应显示绿色色块，无需联网</view>
      <view class="offline-background h-10 w-40 bg-center bg-cover" />
      <view class="mt-[14px] mb-[7px] text-[12px] text-[#52615a]">伪元素文字 · 应分别显示 english 和中文</view>
      <view class="before:text-sm before:content-['english']" />
      <view class="before:text-sm before:content-['中文']" />
    </view>
    <view class="mt-[28px] border-t-[1px] border-[#dce4df] border-t-solid pt-[22px]">
      <view class="text-[18px] font-bold">远程背景与 URL 任意值</view>
      <view class="mt-[7px] mb-[16px] text-[#52615a]">预期：显示葡萄柚图片和红色蝙蝠，分别验证普通图片 URL 与包含冒号、问号和等号的 SVG URL。此组需要联网，小程序端还需资源域名可访问。</view>
      <view class="mt-[14px] mb-[7px] text-[12px] text-[#52615a]">图片背景 · 居中、覆盖容器</view>
      <view
        class="bg-[url(https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg)]" ma h-20 w-40 un-color="red"
        bg="center cover"
      />
      <view class="mt-[14px] mb-[7px] text-[12px] text-[#52615a]">SVG 背景 · 查询参数指定红色</view>
      <view
        class="h-20 w-40 bg-[url(https://api.iconify.design/carbon/bat.svg?color=red)]" ma
        bg="center contain no-repeat"
      />
    </view>
    <view class="mt-[28px] text-[12px] text-[#52615a]">检查完成后，可在另一端对照同名分组。</view>
  </view>
</template>

<style src="./index.css"></style>
<style scoped>
.custom-div {
  --at-apply: text-right text-red-700;
}
</style>
