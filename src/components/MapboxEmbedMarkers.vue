<template>
  <div v-if="useContainer" class="map-container" :style="{ width, height }">
    <div v-if="mapId" :id="mapId" class="map" />
  </div>
  <div v-else-if="mapId" :id="mapId" class="map" />
</template>

<script lang="ts" setup>
import * as turf from '@turf/turf'
import mapboxgl from 'mapbox-gl'
import { computed, nextTick, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import 'mapbox-gl/dist/mapbox-gl.css'

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
    default: null,
  },
  showMarkers: {
    type: Boolean,
    default: true,
  },
  zoom: {
    type: String,
    default: '1',
  },
  mapStyle: {
    type: String,
    default: 'streets',
  },
  accessToken: {
    type: String,
    default: null,
  },
  width: {
    type: String,
    default: null,
  },
  height: {
    type: String,
    default: null,
  },
  markerIcon: {
    type: String,
    default: null,
  },
  markerIcons: {
    type: Array,
    default: null,
  },
  markerAnchor: {
    type: String,
    default: 'center',
  },
  markerLabels: {
    type: Array,
    default: null,
  },
  padding: {
    type: Number,
    default: 80,
  },
  customStyleUrl: {
    type: String,
    default: null,
  },
  showDraggableMarker: {
    type: Boolean,
    default: false,
  },
  draggableMarkerIcon: {
    type: String,
    default: null,
  },
  draggableMarkerCoordinates: {
    type: Object,
    default: null,
  },
})
const emit = defineEmits(['mapLoaded', 'markerClicked', 'coordinatesUpdated', 'mapMoved', 'mapZoomed', 'mapIdled', 'mapClicked', 'draggableMarkerClicked', 'draggableMarkerMoved'])

const map = ref()
const markers = ref()
const markerZIndex = ref(1)
const mapId = ref()
const draggableMarker = ref()
const createDraggableTimeoutId = ref()
const removeDraggableTimeoutId = ref()

const useContainer = computed(() => props.width || props.height)
const coordsArray = computed(() => props.coordinates && mapId.value ? parseCoordinates(props.coordinates) : null)
const center = computed(() => coordsArray.value ? turf.getCoords(turf.center(turf.points(coordsArray.value as any[]))) : null)
const mapBounds = computed(() => turf.bbox(turf.lineString(coordsArray.value as any[])))
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

watch(
  () => props.showDraggableMarker,
  () => {
    props.showDraggableMarker ? createDraggableMarker(props.draggableMarkerCoordinates || map.value.getCenter()) : removeDraggableMarker()
  },
)

onBeforeMount(() => {
  mapboxgl.accessToken = props.accessToken
})

onMounted(async () => {
  mapId.value = `map${globalThis.crypto.getRandomValues(new Uint32Array(10))[0]}`
  await nextTick()
  map.value = new mapboxgl.Map({
    container: mapId.value, // container ID
    projection: 'mercator',
    style: styleUrl.value, // style URL
    center: center.value || [0, 0], // starting position [lng, lat]
    zoom: startingZoom.value, // starting zoom,
    // projection: 'naturalEarth' // starting projection
  } as MapBoxOptionsExtended)
  map.value.dragRotate.disable()
  map.value.touchZoomRotate.disableRotation()
  initCoords()
})

onUnmounted(() => {
  map.value?.remove()
})

function parseCoordinates(coordString: string) {
  return coordString?.split('|').map(
    loc =>
      loc
        .split(',')
        .map(coords => Number(coords))
        .reverse() as mapboxgl.LngLatLike,
  ) as mapboxgl.LngLatLike[]
}

const doubleClicking = ref(false)
const markerClicking = ref(false)
const markerAnimating = ref(false)

function toggleMarkerClicking() {
  markerClicking.value = true
  setTimeout(() => markerClicking.value = false, 10)
}

function initCoords() {
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
    map.value.on('dblclick', () => {
      doubleClicking.value = true
      setTimeout(() => doubleClicking.value = false, 10)
    })

    map.value.on('click', (e: any) => {
      if (!markerClicking.value && !markerAnimating.value) {
        const { lat, lng } = e.lngLat || {}
        props.showDraggableMarker && setDraggableMarkerCoordinates([lng, lat])
        emit('mapClicked')
      }
    })
    markers.value = props.showMarkers
      ? coordsArray.value.map((coords, ix) => {
        const marker = createMarker(coords, ix)
        const el = marker?.getElement()
        if (el) {
          el.onclick = () => {
            markerZIndex.value++
            el.style.zIndex = String(markerZIndex.value)
            emit('markerClicked', [marker, ix])
            toggleMarkerClicking()
          }
        }
        return marker
      })
      : []
    emit('mapLoaded', [map.value, coordsArray.value, markers.value])
    props.showDraggableMarker && createDraggableMarker(props.draggableMarkerCoordinates || map.value.getCenter())
    setBoundsToCoords()
  } else if (map.value) {
    emit('mapLoaded', [map.value, null])
  }
}
function createMarker(coords: any, ix: number) {
  const el = props.markerIcons || props.markerIcon ? document.createElement('div') : undefined
  const icon = props.markerIcons ? props.markerIcons[ix] : props.markerIcon
  if (el) {
    el.className = 'marker'
    const markerIcon = document.createElement('div')
    markerIcon.className = 'marker-icon' as any
    markerIcon.style.backgroundImage = `url("${icon}")` as any
    el.appendChild(markerIcon)
    el.id = `marker${ix}`
    props.markerLabels && el.style.setProperty('--marker-label', `"${props.markerLabels[ix]}"`)
  }
  return new mapboxgl.Marker({ element: el, anchor: props.markerAnchor as mapboxgl.Anchor, rotationAlignment: 'map' })
    .setLngLat(coords)
    .addTo(map.value as mapboxgl.Map)
}
function createDraggableMarker(coords: any) {
  if (removeDraggableTimeoutId.value) {
    clearTimeout(removeDraggableTimeoutId.value)
    removeDraggableTimeoutId.value = null
    draggableMarker.value?.remove()
    draggableMarker.value = null
    markerAnimating.value = false
  }
  const el = document.createElement('div')
  const icon = props.draggableMarkerIcon || props.markerIcon
  if (el) {
    el.classList.add('marker', 'draggable')
    const markerIcon = document.createElement('div')
    markerIcon.className = 'marker-icon' as any
    markerIcon.style.backgroundImage = `url("${icon}")` as any
    el.appendChild(markerIcon)
    el.id = `draggableMarker`
    el.style.zIndex = '99999'
    el.classList.add('toggle-show')
    markerAnimating.value = true
    createDraggableTimeoutId.value = setTimeout(() => {
      el.classList.remove('toggle-show')
      markerAnimating.value = false
    }, 900)
    el.onclick = () => {
      emit('draggableMarkerClicked')
      toggleMarkerClicking()
    }
  }
  draggableMarker.value = new mapboxgl.Marker({ element: el, anchor: props.markerAnchor as mapboxgl.Anchor, rotationAlignment: 'map', draggable: true })
    .setLngLat(coords)
    .addTo(map.value as mapboxgl.Map)

  const label = props.draggableMarkerCoordinates ? [props.draggableMarkerCoordinates.lat, props.draggableMarkerCoordinates.lng] : [map.value.getCenter().lat, map.value.getCenter().lng]

  setDraggableMarkerStyle(label.join())

  draggableMarker.value.on('dragstart', () => {
    const el = draggableMarker.value?.getElement()
    if (el) {
      el.classList.add('dragging')
      el.classList.remove('dragged')
    }
  })

  draggableMarker.value.on('dragend', (e: any) => {
    const lngLat = e.target.getLngLat()
    setDraggableMarkerStyle([lngLat.lat, lngLat.lng].join())
    emit('draggableMarkerMoved', { ...lngLat })
  })
}
function setDraggableMarkerStyle(label?: string) {
  const el = draggableMarker.value?.getElement()
  if (el) {
    el.style.setProperty('--marker-label', `"${label}"`)
    el.classList.add('dragged')
    el.classList.remove('dragging')
    setTimeout(() => el.classList.remove('dragged'), 400)
  }
}
function setDraggableMarkerCoordinates(coordinates: any[]) {
  draggableMarker.value.setLngLat(coordinates)
  setDraggableMarkerStyle(coordinates.join())
  emit('draggableMarkerMoved', { lng: coordinates[0], lat: coordinates[1] })
}
function removeDraggableMarker() {
  const el = draggableMarker.value?.getElement()
  if (createDraggableTimeoutId.value) {
    clearTimeout(createDraggableTimeoutId.value)
    createDraggableTimeoutId.value = null
    el.classList.remove('toggle-show')
    markerAnimating.value = false
  }
  if (el) {
    el.classList.add('toggle-hide')
    markerAnimating.value = true
    removeDraggableTimeoutId.value = setTimeout(() => {
      draggableMarker.value?.remove()
      draggableMarker.value = null
      markerAnimating.value = false
    }, 900)
  }
}
function setBoundsToCoords(options?: {
  coordinates?: []
  duration?: number
  padding?: { top?: number, right?: number, bottom?: number, left?: number }
}) {
  const { duration, padding } = options || {}
  const coordinates = options?.coordinates || coordsArray.value
  const bounds = options?.coordinates ? turf.bbox(turf.lineString(options?.coordinates as any[])) : mapBounds.value
  if (coordinates && coordinates?.length > 1) {
    map.value?.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
      duration: duration || 0,
      padding: {
        top: props.padding + (padding?.top || 0),
        bottom: props.padding + (padding?.bottom || 0),
        left: props.padding + (padding?.left || 0),
        right: props.padding + (padding?.right || 0),
      },
    })
  } else if (coordinates) {
    map.value?.setZoom(15)
    map.value?.panTo(coordinates[0])
  } else {
    map.value?.setZoom(15)
  }
}
function updateCoords() {
  if (map.value && coordsArray.value) {
    coordsArray.value.forEach((coords, ix) => {
      /* update marker coords */
      markers.value?.[ix]?.setLngLat(coords)
    })
    emit('coordinatesUpdated', [map.value, coordsArray.value])
  }
}

defineExpose({
  setBoundsToCoords,
  parseCoordinates,
})
</script>

<style lang="scss" scoped>
.map {
  width: 100%;
  height: 100%;
}

:deep(.marker) {
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: top 300ms;

  &.dragged:not(.toggle-show) {
    animation-name: dragged;
    animation-duration: 300ms;
    position: relative;
  }

  &.toggle-show {
    animation-name: toggle-show;
    animation-duration: 1000ms;
    position: relative;
  }

  &.toggle-hide {
    animation-name: toggle-hide;
    animation-duration: 1000ms;
    position: relative;
  }

  .marker-icon {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }
}

@keyframes dragged {
  0%   { top: 0; }
  50% { top: 0.125rem; }
  100% { top: 0; }
}

@keyframes toggle-show {
  0%   { top: -1000px; }
  75% { top: 0.125rem; }
  100% { top: 0; }
}

@keyframes toggle-hide {
  0%   { top: 0; }
  25% { top: 0.125rem; }
  100% { top: -1000px; }
}
</style>
