<template>
  <div v-if="useContainer" class="map-container" :style="{ width, height }">
    <div v-if="mapId" :id="mapId" class="map"></div>
  </div>
  <div v-else-if="mapId" :id="mapId" class="map" />
</template>

<script lang="ts" setup>
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import { ref, computed, onMounted, onBeforeMount, watch, onUnmounted, nextTick } from 'vue'
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

const props = defineProps({
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
    default: null
  },
  height: {
    type: String,
    default: null
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
})
const emit = defineEmits(['mapLoaded', 'markerClicked', 'coordinatesUpdated', 'mapMoved', 'mapZoomed', 'mapIdled'])

const map = ref()
const markers = ref()
const markerZIndex = ref(1)
const mapId = ref()

const useContainer = computed(() => props.width || props.height)
const coordsArray = computed(() => props.coordinates && mapId.value ? parseCoordinates(props.coordinates) : null)
const center = computed(() => coordsArray.value ? turf.getCoords(turf.center(turf.points(coordsArray.value as turf.Position[]))) : null)
const bounds = computed(() => turf.bbox(turf.lineString(coordsArray.value as turf.Position[])))
const startingZoom = computed(() => Number(props.zoom))
const styleUrl = computed(() => {
  switch (props.mapStyle as Styles) {
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
      return props.customStyleUrl || 'mapbox://styles/mapbox/streets-v11'
    default:
      return 'mapbox://styles/mapbox/streets-v11'
  }
})

watch(coordsArray, async (newCoords, oldCoords) => {
  if (newCoords && oldCoords) {
    const newCoordinates = parseCoordinates(newCoords as any)
    const oldCoordinates = parseCoordinates(oldCoords as any)
    if (newCoordinates.length > oldCoordinates.length) {
      const ix = newCoordinates.length - 1
      props.showMarkers && markers.value?.push(createMarker(newCoordinates[ix], ix))
      setBoundsToCoords()
    }
    await nextTick()
    updateCoords()
  }
})

onBeforeMount(() => {
  mapboxgl.accessToken = props.accessToken
})

onMounted(async () => {
  console.log(props.coordinates)
  mapId.value = `map${self.crypto.getRandomValues(new Uint32Array(10))[0]}`
  await nextTick()
  map.value = new mapboxgl.Map({
    container: mapId.value, // container ID
    projection: 'mercator',
    style: styleUrl.value, // style URL
    center: center.value || [0, 0], // starting position [lng, lat]
    zoom: startingZoom.value // starting zoom,
    // projection: 'naturalEarth' // starting projection
  } as MapBoxOptionsExtended)
  map.value.dragRotate.disable()
  map.value.touchZoomRotate.disableRotation()
  initCoords()
})

onUnmounted(() => {
  map.value?.remove()
})


const parseCoordinates = (coordString: string) => {
  return coordString.split('|').map(
    loc =>
      loc
        .split(',')
        .map(coords => Number(coords))
        .reverse() as mapboxgl.LngLatLike
  ) as mapboxgl.LngLatLike[]
}
const initCoords = () => {
  if (map.value && coordsArray.value) {
    map.value.on('moveend', () => {
      emit('mapMoved')
    })
    map.value.on('zoomend', () => {
      emit('mapZoomed')
    })
    map.value.on('idle', () => {
      emit('mapIdled')
    })
    markers.value = props.showMarkers ? coordsArray.value.map((coords, ix) => {
      const marker = createMarker(coords, ix)
      const el = marker.getElement()
      el.onclick = () => {
        markerZIndex.value++
        el.style.zIndex = String(markerZIndex.value)
        emit('markerClicked', [marker, ix])
      }
      return marker
    }) : []
    emit('mapLoaded', [map.value, coordsArray.value, markers.value])
    setBoundsToCoords()
  } else if (map.value) {
    emit('mapLoaded', [map.value, null])
  }
}
const createMarker = (coords: any, ix: number) => {
  const el = props.markerIcons || props.markerIcon ? document.createElement('div') : undefined
  const icon = props.markerIcons ? props.markerIcons[ix] : props.markerIcon
  if (el) {
    el.className = 'marker'
    const markerIcon = document.createElement('div')
    markerIcon.className = 'marker-icon' as any
    markerIcon.style.backgroundImage = `url("${icon}")` as any
    el.appendChild(markerIcon)
    el.id = 'marker' + ix
    props.markerLabels && el.style.setProperty('--markerLabel', `"${props.markerLabels[ix]}"`)
  }
  return new mapboxgl.Marker({ element: el, anchor: props.markerAnchor as mapboxgl.Anchor, rotationAlignment: 'map' })
    .setLngLat(coords)
    .addTo(map.value as mapboxgl.Map)
}
const setBoundsToCoords = (options?: {
  duration?: number
  padding?: { top?: number; right?: number; bottom?: number; left?: number }
}) => {
  const { duration, padding } = options || {}
  if (coordsArray.value && coordsArray.value?.length > 1) {
    map.value?.fitBounds(bounds.value as mapboxgl.LngLatBoundsLike, {
      duration: duration || 0,
      padding: {
        top: props.padding + (padding?.top || 0),
        bottom: props.padding + (padding?.bottom || 0),
        left: props.padding + (padding?.left || 0),
        right: props.padding + (padding?.right || 0)
      }
    })
  } else if (coordsArray.value) {
    map.value?.setZoom(15)
    map.value?.panTo(coordsArray.value[0])
  } else {
    map.value?.setZoom(15)
  }
}
const updateCoords = () => {
  if (map.value && coordsArray.value) {
    console.log(coordsArray.value)
    coordsArray.value.map((coords, ix) => {
      /* update marker coords */
      markers.value?.[ix]?.setLngLat(coords)
    })
    emit('coordinatesUpdated', [map.value, coordsArray.value])
  }
}

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
