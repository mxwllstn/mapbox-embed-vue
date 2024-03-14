<template>
  <div class="container">
    <MapboxEmbed
      :coordinates="coordinatesString" map-style="custom" :custom-style-url="mapboxCustomStyleUrl" zoom="3"
      :access-token="mapboxAccessToken" :marker-icons="[markerIcon, markerIconAlt]" marker-anchor="center"
      :marker-labels="markerLabels" @map-loaded="onMapLoad" @marker-clicked="onMarkerClick"
      @coordinates-updated="onCoordinatesUpdated" @map-moved="onMapMoved" @map-zoomed="onMapZoomed"
      @map-idled="onMapIdled"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import * as turf from '@turf/turf'
import MapboxEmbed from './components/MapboxEmbed.vue'

const mapboxAccessToken = ref(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN)
const mapboxCustomStyleUrl = ref(import.meta.env.VITE_MAPBOX_CUSTOM_STYLE_URL)
const markerIcon = ref('marker.svg')
const markerIconAlt = ref('marker-alt.svg')

const defaultCoords = computed(() => ['34.072799, -118.262034', '34.077072, -118.269450'])
const locations = computed(() => defaultCoords.value)
const markerLabels = computed(() => locations.value.map((_val, idx) => (idx + 1).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })))
const coordinates = computed(() => locations.value ? locations.value.map((location: any) => location) : null)
const coordinatesString = computed(() => coordinates.value?.join('|'))

function onMapLoad([map, coords, markers]: any) {
  addLines(map, coords)
  markers.value = markers
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
    })
  })
  map.resize()
}
function onMarkerClick([marker]: any): void {
  toggleMarker(marker)
}
function toggleMarker(marker: any) {
  const el = marker.getElement().firstChild
  const { backgroundImage } = el.style
  if (backgroundImage.includes(markerIcon.value))
    setBackgroundImage(el, markerIconAlt.value)
  else
    setBackgroundImage(el, markerIcon.value)
}
// function toggleMarkerByIx(ix: any) {
//   const el = markers.value[ix].getElement()
//   const { backgroundImage } = el.style
//   if (backgroundImage.includes(markerIcon.value)) {
//     setBackgroundImage(el, markerIconAlt.value)
//   } else {
//     setBackgroundImage(el, markerIcon.value)
//   }
// }
function setBackgroundImage(el: { style: { backgroundImage: string } }, image: string) {
  el.style.backgroundImage = `url('/${image}')`
}
</script>

<style lang="scss">
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
