<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { LMap, LTileLayer, LMarker, LPopup, LPolyline } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { getMapConfig } from '@/shared/services/map-config.service.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const props = defineProps({
  stops: { type: Array, default: () => [] },          // [{id,name,latitude,longitude,address?,reference?}]
  polyline: { type: Array, default: null },           // [[lat,lng], ...] optional
  height: { type: String, default: '420px' }
})

const config = ref(null)
const internalCenter = ref(null)
const zoom = ref(13)

const valid = computed(() =>
  props.stops.filter(s => Number.isFinite(+s.latitude) && Number.isFinite(+s.longitude))
)

const computedCenter = computed(() => {
  if (props.polyline?.length) return props.polyline[0]
  if (valid.value.length) {
    const s = valid.value[0]
    return [+s.latitude, +s.longitude]
  }
  return config.value?.defaultCenter || [-12.0464, -77.0428]
})

onMounted(async () => {
  config.value = await getMapConfig()
  internalCenter.value = computedCenter.value
  zoom.value = config.value.defaultZoom
})

watch(computedCenter, v => { if (v) internalCenter.value = v })
</script>

<template>
  <div class="map-markers" :style="{ height }">
    <l-map
      v-if="config && internalCenter"
      :zoom="zoom"
      :center="internalCenter"
      :min-zoom="config.minZoom"
      :max-zoom="config.maxZoom"
      :use-global-leaflet="false"
      style="height: 100%; width: 100%;"
    >
      <l-tile-layer :url="config.tileUrl" :attribution="config.attribution" />
      <l-marker
        v-for="s in valid"
        :key="s.id"
        :lat-lng="[+s.latitude, +s.longitude]"
      >
        <l-popup>
          <strong>{{ s.name }}</strong>
          <div v-if="s.address" style="font-size:12px;">{{ s.address }}</div>
          <div v-if="s.reference" style="font-size:12px;color:#888;">{{ s.reference }}</div>
        </l-popup>
      </l-marker>
      <l-polyline v-if="polyline?.length" :lat-lngs="polyline" color="#B7A6E0" :weight="5" />
    </l-map>
    <div v-else class="map-loading">Cargando mapa…</div>
  </div>
</template>

<style scoped>
.map-markers { width:100%; border-radius:8px; overflow:hidden; border:1px solid var(--carbon-700); }
.map-loading { display:flex; align-items:center; justify-content:center; height:100%; color:var(--carbon-400); }
</style>
