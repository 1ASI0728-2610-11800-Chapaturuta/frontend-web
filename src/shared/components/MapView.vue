<script setup>
import { ref, onMounted, watch } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { getMapConfig } from '@/shared/services/map-config.service.js'

const props = defineProps({
  center: { type: Array, default: null },
  zoom: { type: Number, default: null },
  height: { type: String, default: '380px' }
})

const config = ref(null)
const internalCenter = ref(null)
const internalZoom = ref(null)

onMounted(async () => {
  config.value = await getMapConfig()
  internalCenter.value = props.center || config.value.defaultCenter
  internalZoom.value = props.zoom || config.value.defaultZoom
})

watch(() => props.center, v => { if (v) internalCenter.value = v })
watch(() => props.zoom, v => { if (v) internalZoom.value = v })
</script>

<template>
  <div class="map-view" :style="{ height }">
    <l-map
      v-if="config && internalCenter"
      :zoom="internalZoom"
      :center="internalCenter"
      :min-zoom="config.minZoom"
      :max-zoom="config.maxZoom"
      :use-global-leaflet="false"
      style="height: 100%; width: 100%; border-radius: 8px;"
    >
      <l-tile-layer :url="config.tileUrl" :attribution="config.attribution" />
      <slot />
    </l-map>
    <div v-else class="map-loading">Cargando mapa…</div>
  </div>
</template>

<style scoped>
.map-view { width: 100%; border-radius: 8px; overflow: hidden; }
.map-loading { display:flex; align-items:center; justify-content:center; height:100%; color:var(--carbon-400); }
</style>
