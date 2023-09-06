<template>
  <MapboxEmbedClusters
    v-if="clusters"
    :coordinates="coordinates"
    map-style="custom"
    :custom-style-url="customStyleUrl"
    zoom="3"
    :access-token="accessToken"
    width="100vw"
    height="100vh"
    :marker-icons="markerIcons"
    marker-anchor="center"
    :marker-labels="markerLabels"
    @map-loaded="$emit('map-loaded', $event)"
    @marker-clicked="$emit('marker-clicked', $event)"
    @coordinates-updated="$emit('coordinates-updated', $event)"
    @map-moved="$emit('map-moved')"
    @map-zoomed="$emit('map-zoomed')"
    @map-idled="$emit('map-idled')"
  />
  <MapboxEmbedMarkers
    v-else
    :coordinates="coordinates"
    map-style="custom"
    :custom-style-url="customStyleUrl"
    zoom="3"
    :access-token="accessToken"
    width="100vw"
    height="100vh"
    :marker-icons="markerIcons"
    marker-anchor="center"
    :marker-labels="markerLabels"
    @map-loaded="$emit('map-loaded', $event)"
    @marker-clicked="$emit('marker-clicked', $event)"
    @coordinates-updated="$emit('coordinates-updated', $event)"
    @map-moved="$emit('map-moved')"
    @map-zoomed="$emit('map-zoomed')"
    @map-idled="$emit('map-idled')"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MapboxEmbedClusters from './MapboxEmbedClusters.vue'
import MapboxEmbedMarkers from './MapboxEmbedMarkers.vue'

export default defineComponent({
  components: { MapboxEmbedClusters,  MapboxEmbedMarkers },
  props: {
    coordinates: {
      type: String,
      default: null
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
    },
    clusters: {
      type: Boolean,
      default: false
    }
  },
  emits: ['coordinates-updated', 'map-moved', 'map-zoomed', 'map-idled', 'map-loaded', 'marker-clicked']
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
  background-size: cover;
  width: 40px;
  height: 40px;
  cursor: pointer;
}
</style>
