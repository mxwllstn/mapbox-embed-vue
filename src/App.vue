<template>
  <div class="container">
    <MapboxEmbed
      :cluster-markers="true" :coordinates="coordinatesString" map-style="custom" :custom-style-url="mapboxCustomStyleUrl" zoom="3"
      :access-token="mapboxAccessToken" marker-anchor="center" :marker-icons="markerIcons" :marker-labels="markerLabels" :show-draggable-marker="showDraggableMarker" :draggable-marker-icon="markerIconDraggable" :draggable-marker-coordinates="draggableMarkerCoordinates" :active-marker="activeMarker" @map-loaded="onMapLoad" @marker-clicked="onMarkerClick" @coordinates-updated="onCoordinatesUpdated" @map-moved="onMapMoved" @map-zoomed="onMapZoomed" @map-clicked="handleMapClicked" @map-idled="onMapIdled" @draggable-marker-moved="handleDraggableMarkerMoved" @draggable-marker-clicked="handleDraggableMarkerClicked"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import * as turf from '@turf/turf'
import MapboxEmbed from './components/MapboxEmbed.vue'

function handleMapClicked() {
  showDraggableMarker.value = true
}
function handleDraggableMarkerClicked() {
  showDraggableMarker.value = false
}

const mapboxAccessToken = ref(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string)
const mapboxCustomStyleUrl = ref(import.meta.env.VITE_MAPBOX_CUSTOM_STYLE_URL)
const markerIcon = ref('marker.png')
const markerIconAlt = ref('marker-alt.png')
const markerIcons = computed(() => [markerIcon.value, markerIconAlt.value])
// const markerIcons = ref()
const markerIconDraggable = ref('marker-draggable.svg')

const defaultCoords = computed(() => ['34.072799, -118.262034', '34.077072, -118.269450'])
const locations = computed(() => defaultCoords.value)
const markerLabels = computed(() => locations.value.map((_val, idx) => (idx + 1).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })))
const coordinates = computed(() => locations.value ? locations.value.map((location: any) => location) : null)
const coordinatesString = computed(() => coordinates.value?.join('|'))

const showDraggableMarker = ref(false)
const draggableMarkerCoordinates = ref()

const map = ref()

function onMapLoad([mapEmbed, coords, markers]: any) {
  addLines(mapEmbed, coords)
  map.value = mapEmbed
  markers.value = markers

  if (markerIcons.value) {
    map.value.setLayoutProperty('cluster', 'text-field', ['get', 'labels'])
    map.value.setPaintProperty('unclustered-point', 'icon-opacity', 0.7)
  } else {
    map.value.setPaintProperty('unclustered-point', 'circle-color', [
      'step',
      ['get', 'active'],
      '#fff',
      1,
      '#000',
    ])

    map.value.setPaintProperty('unclustered-point', 'circle-stroke-color', [
      'step',
      ['get', 'active'],
      '#fff',
      1,
      '#000',
    ])

    map.value.setPaintProperty('unclustered-point-text', 'text-color', [
      'step',
      ['get', 'active'],
      '#000000',
      1,
      '#ffffff',
    ])
    map.value.setLayoutProperty('cluster-count', 'text-field', ['get', 'labels'])
    // map.value.setLayoutProperty('cluster-count', 'text-field', null)
    // map.value.setLayoutProperty('cluster-count', 'text-field', ['get', 'point_count_abbreviated'])
  }
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
function addLines(map: any, coords: any) {
  const routes = parseRoutes(coords)

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
      data: routes as any,
    })

    map.addLayer({
      id: 'route',
      source: 'routes',
      type: 'line',
      paint: {
        'line-width': 2,
        'line-color': '#fff',
      },
      minzoom: 14,
    })
  })
  map.resize()
}

const activeMarker = ref()

function onMarkerClick(feature: any): void {
  const id = feature.properties.id
  activeMarker.value = id === activeMarker.value ? null : id
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
