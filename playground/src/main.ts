import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'splitpanes/dist/splitpanes.css'

import './main.css'
import 'uno.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
