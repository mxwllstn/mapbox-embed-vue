import { createRouter } from 'vue-router'
import Index from './index.vue'
import Markers from './markers.vue'

const routes = [
  { path: '', component: Index },
  { path: '/markers', component: Markers },
]

function router(history: any) {
  return createRouter({
    history,
    routes,
  })
}

export default router
