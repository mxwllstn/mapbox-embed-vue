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

export type Styles
  = | 'streets'
    | 'outdoors'
    | 'light'
    | 'dark'
    | 'satellite'
    | 'satellite-streets'
    | 'navigation-day'
    | 'navigation-night'
    | 'custom'

const props = defineProps({
  coordinates: {
    type: String,
    default: null,
  },
  clusterMarkers: {
    type: Boolean,
    default: false,
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
  markerActiveIcon: {
    type: String,
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
  activeMarker: {
    type: Number,
    default: null,
  },
  disabledMarkers: {
    type: Array,
    default: null,
  },
  dataProperties: {
    type: Object,
    default: null,
  },
  sortMarkers: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['mapLoaded', 'markerClicked', 'coordinatesUpdated', 'mapMoved', 'mapZoomed', 'mapIdled', 'mapClicked', 'draggableMarkerClicked', 'draggableMarkerMoved'])

const map = ref()
const mapId = ref()
const draggableMarker = ref()
const createDraggableTimeoutId = ref()
const removeDraggableTimeoutId = ref()

const useContainer = computed(() => props.width || props.height)
const coordsArray = computed(() => props.coordinates && mapId.value ? parseCoordinates(props.coordinates) : null)
const center = computed(() => coordsArray.value ? turf.getCoords(turf.center(turf.points(coordsArray.value as any[]))) : null)
const mapBounds = computed(() => coordsArray.value && coordsArray.value.length > 1 ? turf.bbox(turf.lineString(coordsArray.value as any[])) : null)
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
    const newCoordinates = newCoords
    const oldCoordinates = oldCoords
    if (newCoordinates.length > oldCoordinates.length) {
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

watch(
  () => [props.activeMarker, props.disabledMarkers],
  () => {
    map.value.getSource('points').setData(pointsData.value)
  },
  {
    deep: true,
  },
)

watch(
  () => props.markerActiveIcon,
  () => {
    map.value?.loadImage(props.markerActiveIcon as any, (_error: any, image: any) => {
      if (image) {
        map.value?.removeImage('marker-active', image as any)
        map.value?.addImage('marker-active', image as any)
      }
    })
  },
)

onBeforeMount(() => {
  mapboxgl.accessToken = props.accessToken
})

onMounted(async () => {
  try {
    mapId.value = `map${globalThis.crypto.getRandomValues(new Uint32Array(10))[0]}`
    await nextTick()
    map.value = new mapboxgl.Map({
      container: mapId.value, // container ID
      projection: 'mercator',
      style: styleUrl.value, // style URL
      center: center.value || [0, 0], // starting position [lng, lat]
      zoom: startingZoom.value, // starting zoom,
      fadeDuration: 0,
    } as mapboxgl.MapOptions)
    map.value.dragRotate.disable()
    map.value.touchZoomRotate.disableRotation()
    initCoords()
  } catch (err) {
    console.log({ err })
  }
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

const pointsData = computed(() => {
  return {
    type: 'FeatureCollection',
    features: coordsArray.value
      ? coordsArray.value.map((coords: mapboxgl.LngLatLike, ix: number) => {
          return {
            type: 'Feature',
            properties: {
              id: ix,
              active: props.activeMarker === ix ? 1 : 0,
              disabled: props.disabledMarkers?.includes(ix) ? 1 : 0,
              label: props.markerLabels && props.markerLabels[ix],
              ...(props.dataProperties && props.dataProperties[ix]),
            },
            geometry: {
              type: 'Point',
              coordinates: coords as any,
            },
          }
        })
      : [],
  }
})

const hasMarkerIcons = computed(() => props.markerIcons?.length)

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

    map.value.on('click', async (e: any) => {
      await nextTick()
      if (!markerClicking.value && !markerAnimating.value) {
        const { lat, lng } = e.lngLat || {}
        props.showDraggableMarker && setDraggableMarkerCoordinates([lng, lat])
        emit('mapClicked')
      }
    })
    map.value.on('load', async () => {
      await nextTick()
      map.value?.addSource('points', {
        cluster: props.clusterMarkers,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50),
        clusterProperties: {
          labels: ['concat', ['concat', ['get', 'label'], '\n']],
        },
        type: 'geojson',
        data: pointsData.value,
      })
      if (hasMarkerIcons.value) {
        const marker = props.markerIcons?.[0] || 'marker.png'
        const markerAlt = props.markerIcons?.[1] || 'marker-alt.png'
        const markerActive = props.markerActiveIcon || 'marker-active.png'

        map.value?.loadImage(marker as any, (_error: any, image: any) => {
          if (image) {
            map.value?.addImage('marker', image as any)
          }

          map.value?.loadImage(markerAlt as any, (_error: any, image: any) => {
            if (image) {
              map.value?.addImage('marker-alt', image as any)
            }

            map.value?.loadImage(markerActive as any, (_error: any, image: any) => {
              if (image) {
                map.value?.addImage('marker-active', image as any)
              }

              map.value.addLayer({
                id: 'background-layer',
                type: 'background',
                paint: {
                  'background-color': '#ffffff',
                  'background-opacity': 0,
                },
              })

              map.value.addLayer({
                id: 'cluster',
                type: 'symbol',
                source: 'points',
                filter: ['has', 'point_count'],
                layout: {
                  'icon-image': 'marker',
                  'icon-size': 0.5,
                  'icon-padding': 5,
                  'text-field': ['get', 'point_count_abbreviated'],
                  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                  'text-size': 12,
                },
              })

              map.value?.addLayer({
                id: 'unclustered-point',
                type: 'symbol',
                source: 'points',
                filter: ['!has', 'point_count'],
                layout: {
                  ...(props.sortMarkers && { 'symbol-sort-key': ['to-number', ['get', 'id']] }),
                  'icon-image': 'marker',
                  'icon-size': 0.5,
                  'icon-padding': 0,
                  'icon-allow-overlap': true,
                  'icon-ignore-placement': true,
                  'text-field': ['get', 'label'],
                  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                  'text-size': 12,
                  'text-allow-overlap': true,
                  'text-ignore-placement': true,
                  'icon-offset': [0, 16],
                },
                paint: {
                  'icon-opacity': [
                    'step',
                    ['get', 'disabled'],
                    1,
                    1,
                    0.5,
                  ],
                  'text-opacity': [
                    'step',
                    ['get', 'disabled'],
                    1,
                    1,
                    0.5,
                  ],
                  'text-color': '#000000',
                },
              })

              map.value?.addLayer({
                id: 'unclustered-point-click',
                type: 'circle',
                source: 'points',
                filter: ['!has', 'point_count'],
                paint: {
                  'circle-color': '#fff',
                  'circle-opacity': 0,
                  'circle-radius': 20,
                },
              })

              map.value?.addLayer({
                id: 'unclustered-point-active',
                type: 'symbol',
                source: 'points',
                filter: ['all', ['!has', 'point_count'], ['==', 'active', 1]],
                layout: {
                  'icon-image': 'marker-active',
                  'icon-size': 0.5,
                  'icon-padding': 0,
                  'icon-allow-overlap': true,
                  'icon-ignore-placement': true,
                  'text-allow-overlap': true,
                  'text-ignore-placement': true,
                  'icon-offset': [0, 16],
                },
                paint: {
                  'icon-opacity': 1,
                  'text-opacity': 1,
                  'text-color': '#ffffff',
                },
              })

              emit('mapLoaded', [map.value, coordsArray.value])
            })
          })
        })
      } else {
        map.value.addLayer({
          id: 'cluster',
          type: 'circle',
          source: 'points',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#fff',
            'circle-radius': 28,
          },
        })

        map.value.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'points',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
        })

        map.value?.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'points',
          filter: ['!has', 'point_count'],
          paint: {
            'circle-color': '#ffffff',
            'circle-opacity': 0.7,
            'circle-radius': 14,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
          },
        })

        map.value?.addLayer({
          id: 'unclustered-point-text',
          type: 'symbol',
          source: 'points',
          filter: ['!has', 'point_count'],
          layout: {
            'text-field': ['get', 'label'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#000000',
          },
        })
        emit('mapLoaded', [map.value, coordsArray.value])
      }
    })

    map.value.on('mouseenter', ['cluster', 'unclustered-point-click'], (e: any) => {
      if (e.features?.[0]?.properties?.disabled) {
        map.value.getCanvas().style.cursor = ''
      } else {
        map.value.getCanvas().style.cursor = 'pointer'
      }
    })
    map.value.on('mouseleave', ['cluster', 'unclustered-point-click'], () => {
      map.value.getCanvas().style.cursor = ''
    })

    map.value.on('click', 'cluster', (e: any) => {
      toggleMarkerClicking()
      const features = map.value.queryRenderedFeatures(e.point, {
        layers: ['cluster'],
      })
      const clusterId = features[0].properties.cluster_id
      map.value.getSource('points').getClusterExpansionZoom(
        clusterId,
        (err: any, zoom: any) => {
          if (err) {
            return
          }

          map.value.easeTo({
            center: features[0].geometry.coordinates,
            zoom,
          })
        },
      )
    })

    map.value.on('click', 'unclustered-point-click', (e: any) => {
      toggleMarkerClicking()
      emit('markerClicked', e.features[0])
    })

    props.showDraggableMarker && createDraggableMarker(props.draggableMarkerCoordinates || map.value.getCenter())
    setBoundsToCoords()
  } else if (map.value) {
    emit('mapLoaded', [map.value, null])
  }
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
  const bounds = coordinates && coordinates.length > 1 ? turf.bbox(turf.lineString(coordinates as any[])) : mapBounds.value
  if (coordinates && coordinates?.length > 1 && bounds) {
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
    // coordsArray.value.forEach((coords, ix) => {
    //   /* update marker coords */
    //   markers.value?.[ix]?.setLngLat(coords)
    // })
    emit('coordinatesUpdated', [map.value, coordsArray.value])
  }
}

defineExpose({
  setBoundsToCoords,
  parseCoordinates,
})
</script>

<style lang="css" scoped>
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
  0% {
    top: 0;
  }

  50% {
    top: 0.125rem;
  }

  100% {
    top: 0;
  }
}

@keyframes toggle-show {
  0% {
    top: -1000px;
  }

  75% {
    top: 0.125rem;
  }

  100% {
    top: 0;
  }
}

@keyframes toggle-hide {
  0% {
    top: 0;
  }

  25% {
    top: 0.125rem;
  }

  100% {
    top: -1000px;
  }
}
</style>
