<template>
  <MapboxEmbed
    coordinates="34.072799, -118.262034|34.077072, -118.269450|45.538357, -73.606518|43.679434, -79.457716|19.377078, -99.143622"
    map-style="satellite"
    zoom="3"
    :access-token="mapboxAccessToken"
    width="100vw"
    height="100vh"
    marker="/marker.svg"
    @map-loaded="onMapLoad"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MapboxEmbed from './components'
import * as turf from '@turf/turf'

export default defineComponent({
  components: { MapboxEmbed },
  data() {
    return {
      mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string
    }
  },
  methods: {
    onMapLoad(map: any, coords: any) {
      const routes = {
        type: 'FeatureCollection',
        features: coords.map((_coords: any, idx: number) => {
          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates:
                idx < coords.length - 1
                  ? [coords[idx], coords[idx + 1]]
                  : [coords[idx], coords[0]]
            }
          }
        })
      }

      routes.features.forEach((route: { geometry: { coordinates: any } }) => {
        const lineDistance = turf.length(route as any)
        const arc = []
        const steps = 500

        for (let i = 0; i < lineDistance; i += lineDistance / steps) {
          const segment = turf.along(route as any, i)
          arc.push(segment.geometry.coordinates)
        }

        route.geometry.coordinates = arc as any
      })

      map.on('load', () => {
        map.addSource('routes', {
          type: 'geojson',
          data: routes as any
        })

        map.addLayer({
          id: 'route',
          source: 'routes',
          type: 'line',
          paint: {
            'line-width': 2,
            'line-color': '#fff'
          }
        })
      })
    }
  }
})
</script>
<style lang="scss">
.container {
  width: 500px;
  height: 500px;
}
</style>
