import type { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'

// UnoCSS 入口：webpack 端虚拟模块为 uno.css，需通过 JS import 触发 @unocss/webpack 的 resolveId，
// 不能写在 app.css 的 @import 里（postcss-loader 不会交给 webpack 解析）
import 'uno.css'
import './app.css'

function App({ children }: PropsWithChildren<Record<string, never>>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return children
}

export default App
