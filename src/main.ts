import { createApp } from 'vue'
import { createWebHistory } from 'vue-router'

import App from './App.vue'
import createRouter from './pages/routes'

const router = createRouter(createWebHistory())
const app = createApp(App)

app.use(router).mount('#app')
