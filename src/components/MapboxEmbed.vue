<template>
  <div class="map-container" :style="{ width: width, height: height }">
    <div :id="mapId" class="map"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'

export type Styles =
  | 'streets'
  | 'outdoors'
  | 'light'
  | 'dark'
  | 'satellite'
  | 'satellite-streets'
  | 'navigation-day'
  | 'navigation-night'

interface MapBoxOptionsExtended extends mapboxgl.MapboxOptions {
  projection: string
}

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
      default: '300px'
    },
    height: {
      type: String,
      default: '300px'
    },
    marker: {
      type: String,
      default: null
    }
  },
  emits: ['mapLoaded'],
  computed: {
    coordsArray() {
      return this.coordinates.split('|').map(
        loc =>
          loc
            .split(',')
            .map(coords => Number(coords))
            .reverse() as mapboxgl.LngLatLike
      ) as mapboxgl.LngLatLike[]
    },
    center() {
      return turf.getCoords(turf.center(turf.points(this.coordsArray as turf.Position[]))) as any
    },
    bounds() {
      return turf.bbox(turf.lineString(this.coordsArray as turf.Position[]))
    },
    coords() {
      return this.coordinates
        ? (this.coordinates
            .split(',')
            .map(item => Number(item))
            .reverse() as mapboxgl.LngLatLike)
        : null
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
    },
    mapId() {
      return `map${self.crypto.getRandomValues(new Uint32Array(10))[0]}`
    }
  },
  created() {
    mapboxgl.accessToken = this.accessToken
  },
  mounted() {
    console.log(this.center)
    const map = new mapboxgl.Map({
      container: this.mapId, // container ID
      style: this.styleUrl, // style URL
      center: this.coords || [0, 0], // starting position [lng, lat]
      zoom: this.startingZoom // starting zoom,
      // projection: 'naturalEarth' // starting projection
    } as MapBoxOptionsExtended)

    const markers = this.coordsArray.map(coords => {
      const el = this.marker ? document.createElement('div') : undefined
      if (el) {
        el.className = 'marker'
        el.style.backgroundImage = `url("${this.marker}")`
      }
      return new mapboxgl.Marker(el).setLngLat(coords).addTo(map)
    })

    this.$emit('mapLoaded', map, this.coordsArray)

    if (this.coordsArray?.length > 1) {
      map.fitBounds(this.bounds as mapboxgl.LngLatBoundsLike, { duration: 0, padding: 80 })
      // map.setZoom(2)
    } else {
      map.setZoom(15)
    }
  }
})
</script>

<style lang="scss">
@import 'ress';
@import 'mapbox-gl/dist/mapbox-gl.css';
.map {
  width: 100%;
  height: 100%;
}
.marker {
  background-size: cover;
  width: 40px;
  height: 40px;
  cursor: pointer;
}
.mapboxgl-control-container {
  display: none;
}
</style>
