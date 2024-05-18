import { createRouter } from 'vue-router'
import Index from './index.vue'
import Layers from './layers.vue'

const routes = [
  { path: '', component: Index },
  { path: '/layers', component: Layers },
]

function router(history: any) {
  return createRouter({
    history,
    routes,
  })
}

export default router
