import { Text, View } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { useState } from 'react'

import { menuList } from './data'
import './index.css'

export default function Index() {
  const [bool, setBool] = useState<boolean>()

  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className="aaa u-text-color text-center" p="4">
      <View className="flex justify-center space-x-2">
        <View className="i-tabler-carrot rotate-180 text-4xl" />
        <View className="h-10 w-10 bg-[hsl(2.7,81.9%,69.6%)]" />
      </View>
      <View
        className="border bg-blue-200 font-light font-mono"
        onClick={() => setBool(!bool)}
      >
        <View className="hover:text-red hover:font-bold !hover:bg-gray-600" text="#fff">
          hover bg-gray-600 text-red font-bold
        </View>
      </View>
      <View className={`m-2 p-2.5 ${bool ? 'p-0.5' : 'text-amber'}`}>
        {bool ? 'true' : 'false'}
      </View>
      <View flex="~ col gap-1" className="p-1" items-center>
        <View className="i-tabler:home inline-block text-xl text-blue" color="blue" />
        <View bg="green-(!200 800)">
          index
        </View>
      </View>
      <View flex="~ col" b="~ solid green dark:(red 2)">
        <View text-right h-10 flex="1" text="red">
          0123456789
        </View>
      </View>
      <View className="m-2 p-1 text-2xl">
        abckefghijklmnopqrstuvwxyz
      </View>
      <View flex="~" gap-2>
        {menuList.map((menu, idx) => (
          <View key={idx} className="[&>view]:first:text-green [&>view]:last:text-red">
            <View>{menu.name}</View>
            <View className={menu.icon} />
          </View>
        ))}
      </View>
      <View className="flex gap-2">
        <View className="flex-1 border-red border-solid divide-y-1 divide-red divide-dashed">
          <View className="custom-div">1</View>
          <View>2</View>
        </View>
        <View className="flex flex-1 space-x-1">
          <View className="custom-div w-20 border-1 border-blue border-solid">1</View>
          <View border-blue border-solid border-1 w-20>
            <Text>2</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
