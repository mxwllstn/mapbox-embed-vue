import { createRouter } from 'vue-router'
import Index from './index.vue'
import MarkerMap from './marker-map.vue'

const routes = [
  { path: '', component: Index },
  { path: '/marker-map', component: MarkerMap },
]

function router(history: any) {
  return createRouter({
    history,
    routes,
  })
}

export default router
