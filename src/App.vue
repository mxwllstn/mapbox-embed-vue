<template>
  <MapboxEmbed
    :coordinates="coordinatesString"
    map-style="satellite"
    zoom="3"
    :access-token="mapboxAccessToken"
    width="100vw"
    height="100vh"
    :marker-icon="`/${markerIcon}`"
    @map-loaded="onMapLoad"
    @marker-clicked="onMarkerClick"
    @coordinates-updated="onCoordinatesUpdated"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MapboxEmbed from './components'
import * as turf from '@turf/turf'
import tracker from '@mxwllstn/tracker-vue'

export default defineComponent({
  components: { MapboxEmbed },
  mixins: [tracker],
  data() {
    return {
      mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string,
      markerIcon: 'marker.svg',
      markerIconAlt: 'marker-alt.svg',
      markers: null as any
    }
  },
  computed: {
    defaultCoords() {
      return ['34.072799, -118.262034', '34.077072, -118.269450']
    },
    locations() {
      return this.trackerCoords ? [...this.defaultCoords, this.trackerCoords] : this.defaultCoords
    },
    coordinates(): any {
      return this.locations ? this.locations.map((location: any) => location) : null
    },
    coordinatesString(): string {
      return this.coordinates.join('|')
    },
    trackerCoords() {
      return this.trackerPosition ? `${this.trackerPosition?.coords?.latitude}, ${this.trackerPosition?.coords?.longitude}` : null
    },
    track() {
      const uri = window.location.search.substring(1)
      const params = new URLSearchParams(uri)
      return params.get('track') !== null
    }
  },
  mounted() {
    if (this.track) {
      this.startTracking()
    }
  },
  methods: {
    onMapLoad(map: any, coords: any, markers: any) {
      this.addLines(map, coords)
      this.markers = markers
    },
    onCoordinatesUpdated(map: any, coords: any) {
      this.updateLines(map, coords)
    },
    updateLines(map: any, coords: any) {
      const routes = this.parseRoutes(coords)
      map.getSource('routes').setData(routes)
    },
    parseRoutes(coords: any[]) {
      return {
        type: 'FeatureCollection',
        features: coords.map((_coords: any, idx: number) => {
          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: idx < coords.length - 1 ? [coords[idx], coords[idx + 1]] : [coords[idx], coords[0]]
            }
          }
        })
      }
    },
    addLines(map: any, coords: any) {
      const routes = this.parseRoutes(coords)

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
    },
    onMarkerClick(marker: any, ix: number) {
      this.toggleMarker(marker)
    },
    toggleMarker(marker: any) {
      const el = marker.getElement()
      const { backgroundImage } = el.style
      if (backgroundImage.includes(this.markerIcon)) {
        this.setBackgroundImage(el, this.markerIconAlt)
      } else {
        this.setBackgroundImage(el, this.markerIcon)
      }
    },
    toggleMarkerByIx(ix: any) {
      const el = this.markers[ix].getElement()
      const { backgroundImage } = el.style
      if (backgroundImage.includes(this.markerIcon)) {
        this.setBackgroundImage(el, this.markerIconAlt)
      } else {
        this.setBackgroundImage(el, this.markerIcon)
      }
    },
    setBackgroundImage(el: { style: { backgroundImage: string } }, image: string) {
      el.style.backgroundImage = `url('/${image}')`
    }
  }
})
</script>
<style lang="scss">
.container {
  width: 500px;
  height: 500px;
}
.mapboxgl-control-container {
  display: none;
}

</style>
