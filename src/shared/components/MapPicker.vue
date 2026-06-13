<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getMapConfig } from '@/shared/services/map-config.service.js'
import { reverseGeocode, buildAddress } from '@/shared/services/reverse-geocode.service.js'
import { isWithinPeru } from '@/shared/constants/peru-bounds.js'
import { useToast } from 'primevue/usetoast'

// Fix default icon path (Vite + Leaflet)
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const props = defineProps({
  modelValue: { type: Object, default: null }, // {lat, lng}
  height: { type: String, default: '320px' }
})
const emit = defineEmits(['update:modelValue', 'address'])
const toast = useToast()

const config = ref(null)
const center = ref(null)
const zoom = ref(13)
const marker = ref(props.modelValue ? [props.modelValue.lat, props.modelValue.lng] : null)

onMounted(async () => {
  config.value = await getMapConfig()
  center.value = marker.value || config.value.defaultCenter
  zoom.value = config.value.defaultZoom
})

watch(() => props.modelValue, v => {
  marker.value = v ? [v.lat, v.lng] : null
})

function rejectOutsidePeru() {
  toast?.add({ severity: 'warn', summary: 'Fuera de Perú', detail: 'Solo puedes fijar ubicaciones dentro de Perú.', life: 4000 })
}

function onMapClick(e) {
  const lat = +e.latlng.lat.toFixed(6)
  const lng = +e.latlng.lng.toFixed(6)
  if (!isWithinPeru(lat, lng)) { rejectOutsidePeru(); return }
  marker.value = [lat, lng]
  emit('update:modelValue', { lat, lng })
}

function onMarkerDrag(e) {
  const ll = e.target.getLatLng()
  const lat = +ll.lat.toFixed(6)
  const lng = +ll.lng.toFixed(6)
  if (!isWithinPeru(lat, lng)) {
    rejectOutsidePeru()
    // revertir el marcador a la última posición válida del modelo
    marker.value = props.modelValue ? [props.modelValue.lat, props.modelValue.lng] : null
    return
  }
  marker.value = [lat, lng]
  emit('update:modelValue', { lat, lng })
}

const locating = ref(false)

async function emitAddress(lat, lng) {
  const data = await reverseGeocode(lat, lng)
  const address = buildAddress(data?.address)
  if (address) emit('address', address)
}

function useMyLocation() {
  if (!navigator.geolocation) {
    toast?.add({ severity: 'warn', summary: 'No disponible', detail: 'Tu navegador no soporta geolocalización.', life: 4000 })
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    p => {
      const lat = +p.coords.latitude.toFixed(6)
      const lng = +p.coords.longitude.toFixed(6)
      locating.value = false
      if (!isWithinPeru(lat, lng)) { rejectOutsidePeru(); return }
      marker.value = [lat, lng]
      center.value = [lat, lng]
      zoom.value = 16
      emit('update:modelValue', { lat, lng })
      emitAddress(lat, lng)
    },
    err => {
      locating.value = false
      const detail = err.code === err.PERMISSION_DENIED
        ? 'Permiso de ubicación denegado. Habilítalo en el navegador.'
        : err.code === err.TIMEOUT
          ? 'Tiempo de espera agotado al obtener ubicación.'
          : 'No se pudo obtener tu ubicación.'
      toast?.add({ severity: 'error', summary: 'Ubicación', detail, life: 4000 })
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

const coordsLabel = computed(() =>
  marker.value ? `Lat: ${marker.value[0]}, Lng: ${marker.value[1]}` : 'Haz click en el mapa para fijar el paradero'
)
</script>

<template>
  <div class="map-picker">
    <div class="map-picker-toolbar">
      <span class="coords">{{ coordsLabel }}</span>
      <button type="button" class="loc-btn" :disabled="locating" @click="useMyLocation">
        <i class="pi" :class="locating ? 'pi-spin pi-spinner' : 'pi-compass'"></i> Mi ubicación
      </button>
    </div>
    <div class="map-wrap" :style="{ height }">
      <l-map
        v-if="config && center"
        :zoom="zoom"
        :center="center"
        :min-zoom="config.minZoom"
        :max-zoom="config.maxZoom"
        :use-global-leaflet="false"
        @click="onMapClick"
        style="height: 100%; width: 100%;"
      >
        <l-tile-layer :url="config.tileUrl" :attribution="config.attribution" />
        <l-marker v-if="marker" :lat-lng="marker" :draggable="true" @moveend="onMarkerDrag" />
      </l-map>
      <div v-else class="map-loading">Cargando mapa…</div>
    </div>
  </div>
</template>

<style scoped>
.map-picker { display:flex; flex-direction:column; gap:8px; }
.map-picker-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.coords { font-size:12px; color:var(--carbon-400); }
.loc-btn {
  background:rgba(201,168,76,0.1); border:1px solid rgba(201,168,76,0.3); color:var(--gold-400);
  padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; gap:6px;
}
.loc-btn:hover { background:rgba(201,168,76,0.2); }
.map-wrap { width:100%; border-radius:8px; overflow:hidden; border:1px solid var(--carbon-700); }
.map-loading { display:flex; align-items:center; justify-content:center; height:100%; color:var(--carbon-400); }
</style>
