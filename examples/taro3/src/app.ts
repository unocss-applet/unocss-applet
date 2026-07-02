import type { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'

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
