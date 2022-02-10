<template>
  <div class="container">
    <MapboxEmbed coordinates="34.077072, -118.269450" map-style="satellite-streets" zoom="15" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MapboxEmbed from './components';

export default defineComponent({
  components: { MapboxEmbed },
  data() {
    return {
    }
  }
})
</script>
<style lang="scss">
  .container { width: 500px; height: 500px; }
</style>
