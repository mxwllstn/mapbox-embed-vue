<template>
  <div class="container">
    <MapboxEmbed
  :coordinates="coordinatesString" map-style="custom" :custom-style-url="mapboxCustomStyleUrl" zoom="3"
      :access-token="mapboxAccessToken" :marker-icons="[markerIcon, markerIconAlt]"
      marker-anchor="center" :marker-labels="markerLabels" @map-loaded="onMapLoad" @marker-clicked="onMarkerClick"
      @coordinates-updated="onCoordinatesUpdated" @map-moved="onMapMoved" @map-zoomed="onMapZoomed"
      @map-idled="onMapIdled" />
  </div>
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
      mapboxCustomStyleUrl: import.meta.env.VITE_MAPBOX_CUSTOM_STYLE_URL as string,
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
    markerLabels() {
      return this.locations.map((_val, idx) => (idx + 1).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }))
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
    onMapLoad([map, coords, markers]: any): void {
      this.addLines(map, coords)
      this.markers = markers
    },
    onMapMoved(): void {
      console.log('map moved')
    },
    onMapZoomed(): void {
      console.log('map zoomed')
    },
    onMapIdled(): void {
      console.log('map idled')
    },
    onCoordinatesUpdated([map, coords]: any): void {
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
      map.resize()
    },
    onMarkerClick([marker, ix]: any): void {
      this.toggleMarker(marker)
    },
    toggleMarker(marker: any) {
      const el = marker.getElement().firstChild
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

.marker {
  &::after {
    content: var(--markerLabel);
    position: absolute;
    top: 0px;
    left: 35px;
  }
}

</style>
