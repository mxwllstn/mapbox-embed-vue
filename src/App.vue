<template>
  <MapboxEmbed
    coordinates="34.077072, -118.269450"
    map-style="satellite-streets"
    zoom="15"
    :access-token="mapboxAccessToken"
    width="250px"
    height="250px"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MapboxEmbed from './components'

export default defineComponent({
  components: { MapboxEmbed },
  data() {
    return {
      mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string
    }
  }
})
</script>
<style lang="scss">
.container {
  width: 500px;
  height: 500px;
}
</style>
