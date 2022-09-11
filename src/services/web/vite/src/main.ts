import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style/index.css'
import './style/markdown.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.mount('#app')