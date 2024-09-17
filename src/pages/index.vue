<template>
  <div class="container">
    <MapboxEmbed
      :coordinates="coordinatesString" map-style="custom" :custom-style-url="mapboxCustomStyleUrl" zoom="3" :access-token="mapboxAccessToken" :marker-icons="markerIcons" :marker-active-icon="markerActiveIcon" marker-anchor="center" :active-marker="activeMarker" :marker-labels="markerLabels" :show-draggable-marker="showDraggableMarker" :disabled-markers="disabled" :draggable-marker-icon="markerIconDraggable" :draggable-marker-coordinates="draggableMarkerCoordinates" @map-loaded="onMapLoad" @marker-clicked="onMarkerClick" @coordinates-updated="onCoordinatesUpdated" @map-moved="onMapMoved" @map-zoomed="onMapZoomed" @map-clicked="showDraggableMarker = true" @map-idled="onMapIdled" @draggable-marker-moved="handleDraggableMarkerMoved" @draggable-marker-clicked="showDraggableMarker = false"
    />
  </div>
</template>

<script lang="ts" setup>
import * as turf from '@turf/turf'
import { computed, ref, watch } from 'vue'
import MapboxEmbed from '../components/MapboxEmbed.vue'

const mapboxAccessToken = ref(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string)
const mapboxCustomStyleUrl = ref(import.meta.env.VITE_MAPBOX_CUSTOM_STYLE_URL)
const markerIcon = ref('marker.png')
const markerIconAlt = ref('marker-alt.png')
const markerIconDraggable = ref('marker-draggable.png')
const markerActiveIcon = ref('marker-active.png')
const markerIcons = ref([markerIcon.value, markerIconAlt.value])

const disabled = ref([])

const defaultCoords = computed(() => ['34.072799, -118.262034', '34.077072, -118.269450'])
const locations = computed(() => defaultCoords.value)
const markerLabels = computed(() => locations.value.map((_val, idx) => (idx + 1).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })))
const coordinates = computed(() => locations.value ? locations.value.map((location: any) => location) : null)
const coordinatesString = computed(() => coordinates.value?.join('|'))

const showDraggableMarker = ref(false)
const draggableMarkerCoordinates = ref()

const map = ref()

function onMapLoad([mapEmbed, coords]: any) {
  map.value = mapEmbed
  addLines(coords)

  // map.value.setLayoutProperty('cluster', 'text-field', ['get', 'labels'])
  // map.value.setPaintProperty('unclustered-point', 'icon-opacity', 0.7)

  map.value.setPaintProperty('unclustered-point', 'icon-opacity', [
    'step',
    ['get', 'disabled'],
    0.9,
    1,
    0.3,
  ])
}
function onMapMoved() {
  console.log('map moved')
}

function onMapZoomed() {
  console.log('map zoomed')
}

function onMapIdled() {
  console.log('map idled')
}
function handleDraggableMarkerMoved(coordinates: any) {
  draggableMarkerCoordinates.value = coordinates
}

watch(
  () => showDraggableMarker.value,
  async () => {
    showDraggableMarker.value && draggableMarkerCoordinates.value && map.value.flyTo({ center: draggableMarkerCoordinates.value })
  },
)
function onCoordinatesUpdated([map, coords]: any) {
  updateLines(map, coords)
}
function updateLines(map: any, coords: any) {
  const routes = parseRoutes(coords)
  map.getSource('routes').setData(routes)
}
function parseRoutes(coords: any[]) {
  return {
    type: 'FeatureCollection',
    features: coords.map((_coords: any, idx: number) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: idx < coords.length - 1 ? [coords[idx], coords[idx + 1]] : [coords[idx], coords[0]],
        },
      }
    }),
  }
}
function addLines(coords: any) {
  const routes = parseRoutes(coords)

  map.value.addSource('routes', {
    type: 'geojson',
    data: routes as any,
  })

  map.value.addLayer({
    id: 'route',
    source: 'routes',
    type: 'line',
    paint: {
      'line-width': 2,
      'line-color': '#fff',
    },
  })

  map.value.moveLayer('route', 'unclustered-point')

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

  map.value.resize()
}
const activeMarker = ref()

function onMarkerClick(feature: any): void {
  const { id, disabled } = feature.properties || {}
  if (!disabled) {
    if (id === activeMarker.value) {
      toggleActiveIcon()
    } else {
      resetActiveIcon()
    }
    activeMarker.value = id
  }
}
function resetActiveIcon() {
  markerActiveIcon.value = 'marker-active.png'
}
function toggleActiveIcon() {
  markerActiveIcon.value = markerActiveIcon.value === 'marker-active.png' ? 'marker-active-2.png' : 'marker-active.png'
}
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
}

.container {
  width: 100vw;
  height: 100vh;
}

.mapboxgl-control-container {
  display: none;
}

.marker {
  &::after {
    content: var(--marker-label);
    position: absolute;
    top: 0;
    left: 35px;
  }
}
</style>
