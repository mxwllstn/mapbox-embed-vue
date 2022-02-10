<template>
  <div class="map-container" :style="{ width: width, height: height}">
    <div id="map"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import mapboxgl from 'mapbox-gl'

export type Styles =
  | 'streets'
  | 'outdoors'
  | 'light'
  | 'dark'
  | 'satellite'
  | 'satellite-streets'
  | 'navigation-day'
  | 'navigation-night'

export default defineComponent({
  props: {
    coordinates: {
      type: String,
      default: null
    },
    zoom: {
      type: String,
      default: '9'
    },
    mapStyle: {
      type: String,
      default: 'streets'
    },
    accessToken: {
      type: String,
      default: null
    },
    width: {
      type: String,
      default: "300px"
    },
    height: {
      type: String,
      default: "300px"
    }
  },
  computed: {
    coords() {
      return this.coordinates
        .split(',')
        .map(item => Number(item))
        .reverse() as mapboxgl.LngLatLike
    },
    startingZoom() {
      return Number(this.zoom)
    },
    styleUrl() {
      switch (this.mapStyle as Styles) {
        case 'streets':
          return 'mapbox://styles/mapbox/streets-v11'
        case 'outdoors':
          return 'mapbox://styles/mapbox/outdoors-v11'
        case 'light':
          return 'mapbox://styles/mapbox/light-v10'
        case 'dark':
          return 'mapbox://styles/mapbox/dark-v10'
        case 'satellite':
          return 'mapbox://styles/mapbox/satellite-v9'
        case 'satellite-streets':
          return 'mapbox://styles/mapbox/satellite-streets-v11'
        case 'navigation-day':
          return 'mapbox://styles/mapbox/navigation-day-v1'
        case 'navigation-night':
          return 'mapbox://styles/mapbox/navigation-night-v1'
        default:
          return 'mapbox://styles/mapbox/streets-v11'
      }
    }
  },
  created() {
    mapboxgl.accessToken = this.accessToken
  },
  mounted() {
    const map = new mapboxgl.Map({
      container: 'map', // container ID
      style: this.styleUrl, // style URL
      center: this.coords, // starting position [lng, lat]
      zoom: this.startingZoom // starting zoom
    })
    const marker = new mapboxgl.Marker().setLngLat(this.coords).addTo(map)
  }
})
</script>

<style lang="scss">
@import 'ress';
@import 'mapbox-gl/dist/mapbox-gl.css';
#map {
  width: 100%;
  height: 100%;
}
</style>
