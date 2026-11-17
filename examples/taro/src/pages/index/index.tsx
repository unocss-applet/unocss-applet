import { Button, View } from '@tarojs/components'
import { useState } from 'react'
import { menuList } from './data'
import './index.css'

export default function Index() {
  const [active, setActive] = useState(false)
  const steps = [1, 2]
  const bg = 'bg-[hsl(2.7,81.9%,69.6%)]'

  return (
    <View className="mx-auto box-border max-w-[720PX] bg-white px-[20PX] pt-[24PX] pb-[40PX] text-[14PX] text-[#24332d] leading-[1.65]">
      <View className="text-[25PX] font-bold leading-[1.3]">UnoCSS Playground</View>
      <View className="mt-[10PX] text-[#52615a]">Taro · 对照预期检查样式，按住或点击交互区域。</View>
      <View className="mt-[28PX] border-t-[1PX] border-[#dce4df] border-t-solid pt-[22PX]">
        <View className="text-[18PX] font-bold">分数与小数</View>
        <View className="mt-[7PX] mb-[16PX] text-[#52615a]">预期：绿色条占轨道一半，橙色条是一条细线，两者宽度不同。</View>
        <View className="mt-[14PX] mb-[7PX] text-[12PX] text-[#52615a]">w-1&#47;2 · 50%</View>
        <View className="overflow-hidden bg-[#edf1ee]"><View className="w-1/2 h-6 bg-emerald-600" /></View>
        <View className="mt-[14PX] mb-[7PX] text-[12PX] text-[#52615a]">w-1&#46;2 · 0.3rem 对应的长度</View>
        <View className="overflow-hidden bg-[#edf1ee]"><View className="w-1.2 h-6 bg-orange-600" /></View>
      </View>
      <View className="mt-[28PX] border-t-[1PX] border-[#dce4df] border-t-solid pt-[22PX]">
        <View className="text-[18PX] font-bold">按压反馈</View>
        <View className="mt-[7PX] mb-[16PX] text-[#52615a]">预期：按住后背景变深、文字变红加粗，松开恢复。H5 用鼠标悬停。</View>
        <View className="box-border flex min-h-[56PX] items-center justify-center rounded-[8PX] bg-blue-100 px-[16PX] py-[12PX] text-slate-800 hover:text-red-700 hover:font-bold !hover:bg-gray-200">按住这里检查样式</View>
        <View className="mt-[14PX] mb-[7PX] text-[12PX] text-[#52615a]">原生 hoverClass · 按住变绿</View>
        <View className="box-border flex min-h-[56PX] items-center justify-center rounded-[8PX] bg-slate-100 px-[16PX] py-[12PX]" hoverClass="!bg-green-200">按住这里检查原生按压态</View>
      </View>
      <View className="mt-[28PX] border-t-[1PX] border-[#dce4df] border-t-solid pt-[22PX]">
        <View className="text-[18PX] font-bold">动态类名</View>
        <View className="mt-[7PX] mb-[16PX] text-[#52615a]">预期：点击切换后，状态文字、背景和内边距一起变化。</View>
        <Button className="m-0 box-border block w-full cursor-pointer rounded-[8PX] border-[1PX] border-[#376c53] border-solid bg-white px-[16PX] py-[12PX] text-center text-[14PX] text-[#24573f] leading-[1.65] after:border-0" onClick={() => setActive(!active)}>
          {active ? '切回默认状态' : '切换到选中状态'}
        </Button>
        <View className={`mt-[14PX] p-2.5 ${active ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}`}>
          {active ? '选中状态 · 绿色' : '默认状态 · 琥珀色'}
          <View className={active ? 'p-0.5 font-bold' : 'p-2.5'}>{active ? '小内边距、粗体' : '大内边距、常规字重'} · 数组读取 {steps[1]}</View>
        </View>
      </View>
      <View className="mt-[28PX] border-t-[1PX] border-[#dce4df] border-t-solid pt-[22PX]">
        <View className="text-[18PX] font-bold">属性与变体组</View>
        <View className="mt-[7PX] mb-[16PX] text-[#52615a]">预期：内容纵向排列，有间距；右对齐文字为红色。深色模式下边框变红、加粗。</View>
        <View flex="~ col gap-2" b="~ solid green dark:(red 2)" p="3">
          <View bg="green-200" p="2">属性写法 · 浅绿背景</View>
          <View text="right red" className="font-mono text-sm">右对齐 · 红色文字</View>
          <View text="blue dark:(red !bold)">浅色蓝字 / 深色红色粗体</View>
        </View>
      </View>
      <View className="mt-[28PX] border-t-[1PX] border-[#dce4df] border-t-solid pt-[22PX]">
        <View className="text-[18PX] font-bold">子选择器与间距</View>
        <View className="mt-[7PX] mb-[16PX] text-[#52615a]">预期：名称绿色、图标红色；下方两行之间有红色虚线，两个方块之间有间距。</View>
        <View className="flex gap-4">
          {menuList.map(menu => (
            <View key={menu.name} className="[&>view]:first:text-green-700 [&>view]:last:text-red-700 [&>taro-view-core]:first:text-green-700 [&>taro-view-core]:last:text-red-700">
              <View>{menu.name}</View><View className={`${menu.icon} text-2xl`} />
            </View>
          ))}
        </View>
        <View className="mt-[14PX] flex gap-3">
          <View className="flex-1 border-red-600 border-solid divide-y-1 divide-red-600 divide-dashed">
            <View className="p-2 text-right text-red-700">第一行 · 右对齐红字</View><View className="p-2">第二行</View>
          </View>
          <View className="flex space-x-1">
            <View className="w-8 h-10 border-1 border-blue-600 border-solid text-center">A</View>
            <View className="w-8 h-10 border-1 border-blue-600 border-solid text-center">B</View>
          </View>
        </View>
      </View>
      <View className="mt-[28PX] border-t-[1PX] border-[#dce4df] border-t-solid pt-[22PX]">
        <View className="text-[18PX] font-bold">图标与任意值</View>
        <View className="mt-[7PX] mb-[16PX] text-[#52615a]">预期：倒置胡萝卜、蓝色首页图标都可见；色块为珊瑚色。图标随构建打包，无需联网。</View>
        <View className="flex items-center gap-4">
          <View className="i-tabler-carrot rotate-180 text-4xl text-orange-600" />
          <View className="i-tabler:home inline-block text-3xl text-blue-700" />
          <View className={`h-10 w-10 ${bg}`} />
        </View>
        <View className="mt-[14PX] mb-[7PX] text-[12PX] text-[#52615a]">内嵌背景图片 · 应显示绿色色块，无需联网</View>
        <View className="offline-background h-10 w-40 bg-center bg-cover" />
      </View>
      <View className="mt-[28PX] text-[12PX] text-[#52615a]">检查完成后，可在另一端对照同名分组。</View>
    </View>
  )
}
