<template>
  <div v-if="useContainer" class="map-container" :style="{ width, height }">
    <div v-if="mapId" :id="mapId" class="map"></div>
  </div>
  <div v-else-if="mapId" :id="mapId" class="map" />
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
  | 'custom'

interface MapBoxOptionsExtended extends mapboxgl.MapboxOptions {
  projection: any
}

export default defineComponent({
  props: {
    coordinates: {
      type: String,
      default: null
    },
    showMarkers: {
      type: Boolean,
      default: true
    },
    zoom: {
      type: String,
      default: '1'
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
    markerIcon: {
      type: String,
      default: null
    },
    markerIcons: {
      type: Array,
      default: null
    },
    markerAnchor: {
      type: String,
      default: 'center'
    },
    markerLabels: {
      type: Array,
      default: null
    },
    padding: {
      type: Number,
      default: 80
    },
    customStyleUrl: {
      type: String,
      default: null
    }
  },
  emits: ['mapLoaded', 'markerClicked', 'coordinatesUpdated', 'mapMoved', 'mapZoomed', 'mapIdled'],
  data() {
    return {
      map: null as mapboxgl.Map | null,
      markers: null as mapboxgl.Marker[] | null,
      markerZIndex: 1,
      mapId: null as string | null
    }
  },
  computed: {
    useContainer() {
      return this.width || this.height
    },
    coordsArray() {
      return this.coordinates ? this.parseCoordinates(this.coordinates) : null
    },
    center() {
      return this.coordsArray ? turf.getCoords(turf.center(turf.points(this.coordsArray as turf.Position[]))) : null
    },
    bounds() {
      return turf.bbox(turf.lineString(this.coordsArray as turf.Position[]))
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
        case 'custom':
          return this.customStyleUrl || 'mapbox://styles/mapbox/streets-v11'
        default:
          return 'mapbox://styles/mapbox/streets-v11'
      }
    }
  },
  watch: {
    coordinates: {
      handler(newCoords, oldCoords) {
        const newCoordinates = this.parseCoordinates(newCoords)
        const oldCoordinates = this.parseCoordinates(oldCoords)
        if (newCoordinates.length > oldCoordinates.length) {
          const ix = newCoordinates.length - 1
          this.showMarkers && this.markers?.push(this.createMarker(newCoordinates[ix], ix))
          this.setBoundsToCoords()
        }
        this.$nextTick(() => {
          this.updateCoords()
        })
      }
    }
  },
  created() {
    mapboxgl.accessToken = this.accessToken
  },
  mounted() {
    this.mapId = `map${self.crypto.getRandomValues(new Uint32Array(10))[0]}`
    this.$nextTick(() => {
      this.map = new mapboxgl.Map({
        container: this.mapId, // container ID
        projection: 'mercator',
        style: this.styleUrl, // style URL
        center: this.center || [0, 0], // starting position [lng, lat]
        zoom: this.startingZoom // starting zoom,
        // projection: 'naturalEarth' // starting projection
      } as MapBoxOptionsExtended)
      this.map.dragRotate.disable()
      this.map.touchZoomRotate.disableRotation()
      this.initCoords()
    })
  },
  unmounted() {
    this.map?.remove()
  },
  methods: {
    parseCoordinates(coordinates: string) {
      return coordinates.split('|').map(
        loc =>
          loc
            .split(',')
            .map(coords => Number(coords))
            .reverse() as mapboxgl.LngLatLike
      ) as mapboxgl.LngLatLike[]
    },
    initCoords() {
      if (this.map && this.coordsArray) {
        this.map.on('moveend', () => {
          this.$emit('mapMoved')
        })
        this.map.on('zoomend', () => {
          this.$emit('mapZoomed')
        })
        this.map.on('idle', () => {
          this.$emit('mapIdled')
        })
        this.markers = this.showMarkers ? this.coordsArray.map((coords, ix) => {
          const marker = this.createMarker(coords, ix)
          const el = marker.getElement()
          el.onclick = () => {
            this.markerZIndex++
            el.style.zIndex = String(this.markerZIndex)
            this.$emit('markerClicked', [marker, ix])
          }
          return marker
        }) : []
        this.$emit('mapLoaded', [this.map, this.coordsArray, this.markers])
        this.setBoundsToCoords()
      } else if (this.map) {
        this.$emit('mapLoaded', [this.map, null])
      }
    },
    createMarker(coords: any, ix: number) {
      const el = this.markerIcons || this.markerIcon ? document.createElement('div') : undefined
      const icon = this.markerIcons ? this.markerIcons[ix] : this.markerIcon
      if (el) {
        el.className = 'marker'
        const markerIcon = document.createElement('div')
        markerIcon.className = 'marker-icon' as any
        markerIcon.style.backgroundImage = `url("${icon}")` as any
        el.appendChild(markerIcon)
        el.id = 'marker' + ix
        this.markerLabels && el.style.setProperty('--markerLabel', `"${this.markerLabels[ix]}"`)
      }
      return new mapboxgl.Marker({ element: el, anchor: this.markerAnchor as mapboxgl.Anchor, rotationAlignment: 'map' })
        .setLngLat(coords)
        .addTo(this.map as mapboxgl.Map)
    },
    setBoundsToCoords(options?: {
      duration?: number
      padding?: { top?: number; right?: number; bottom?: number; left?: number }
    }) {
      const { duration, padding } = options || {}
      if (this.coordsArray && this.coordsArray?.length > 1) {
        this.map?.fitBounds(this.bounds as mapboxgl.LngLatBoundsLike, {
          duration: duration || 0,
          padding: {
            top: this.padding + (padding?.top || 0),
            bottom: this.padding + (padding?.bottom || 0),
            left: this.padding + (padding?.left || 0),
            right: this.padding + (padding?.right || 0)
          }
        })
      } else if (this.coordsArray) {
        this.map?.setZoom(15)
        this.map?.panTo(this?.coordsArray[0])
      } else {
        this.map?.setZoom(15)
      }
    },
    updateCoords() {
      if (this.map && this.coordsArray) {
        console.log(this.coordsArray)
        this.coordsArray.map((coords, ix) => {
          /* update marker coords */
          this.markers?.[ix]?.setLngLat(coords)
        })
        this.$emit('coordinatesUpdated', [this.map, this.coordsArray])
      }
    }
  }
})
</script>

<style lang="scss">
@import 'mapbox-gl/dist/mapbox-gl.css';

body {
  margin: 0px;
  padding: 0px;
}

.map {
  width: 100%;
  height: 100%;
}

.marker {
  width: 40px;
  height: 40px;
  cursor: pointer;

  .marker-icon {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }
}
</style>
