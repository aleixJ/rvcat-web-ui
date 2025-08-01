import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import App             from './App.vue'
import router          from './router'

import { Viz } from 'https://cdn.jsdelivr.net/npm/@viz-js/viz@3.3.1/+esm';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
