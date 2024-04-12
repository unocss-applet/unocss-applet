import { createSSRApp } from 'vue'
import App from './App.vue'

import 'uno.css'
import '@unocss-applet/reset/uni-app/tailwind.css'

export function createApp() {
  const app = createSSRApp(App)
  return {
    app,
  }
}
