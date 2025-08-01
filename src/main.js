import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import App             from './App.vue'
import router          from './router'

import * as Viz from "https://cdn.jsdelivr.net/npm/@viz-js/viz@3.15.0"

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
