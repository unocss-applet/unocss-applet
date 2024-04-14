import { createApp } from 'vue'
import './app.css'

import 'uno.css'

const App = createApp({
  onShow(_options: any) {},
  // 入口组件不需要实现 render 方法，即使实现了也会被 taro 所覆盖
})

export default App
