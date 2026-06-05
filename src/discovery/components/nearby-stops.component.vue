<script setup>
import { ref } from 'vue'
import MapWithMarkers from '@/shared/components/MapWithMarkers.vue'
import { DiscoveryNearbyService } from '@/discovery/services/discovery-nearby.service.js'

const service = new DiscoveryNearbyService()

const stops = ref([])
const me = ref(null)
const loading = ref(false)
const error = ref(null)
// El backend interpreta el radio en KILÓMETROS (default 2.0).
const radius = ref(1.5)
const useRoad = ref(false)

async function findNearby() {
  if (!navigator.geolocation) { error.value = 'Geolocalización no soportada'; return }
  loading.value = true; error.value = null
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = +pos.coords.latitude.toFixed(6)
    const lng = +pos.coords.longitude.toFixed(6)
    me.value = { id: 'me', name: 'Tu ubicación', latitude: lat, longitude: lng }
    try {
      const result = await service.nearby({ lat, lng, radius: radius.value, useRoadDistance: useRoad.value })
      stops.value = (result || []).map(s => ({
        id: s.id, name: s.name,
        latitude: s.latitude ?? s.lat,
        longitude: s.longitude ?? s.lng,
        address: s.address, reference: s.reference
      }))
    } catch (e) {
      error.value = e?.isQuotaExceeded
        ? `${e.message} (mejora tu plan en Suscripciones)`
        : e.message
    }
    finally { loading.value = false }
  }, err => { error.value = err.message; loading.value = false })
}

const allMarkers = () => me.value ? [me.value, ...stops.value] : stops.value
</script>

<template>
  <div class="nearby">
    <div class="nearby-toolbar">
      <h3>Paraderos cerca de ti</h3>
      <div class="controls">
        <label>Radio:
          <select v-model.number="radius">
            <option :value="0.5">500 m</option>
            <option :value="1">1 km</option>
            <option :value="1.5">1.5 km</option>
            <option :value="3">3 km</option>
          </select>
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="useRoad" /> Distancia por carretera
        </label>
        <button class="find-btn" :disabled="loading" @click="findNearby">
          <i class="pi pi-compass"></i> {{ loading ? 'Buscando…' : 'Buscar cerca de mí' }}
        </button>
      </div>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <MapWithMarkers v-if="me || stops.length" :stops="allMarkers()" height="420px" />
    <p v-else class="empty">Pulsa el botón para encontrar paraderos cercanos.</p>
  </div>
</template>

<style scoped>
.nearby { display:flex; flex-direction:column; gap:12px; background: var(--carbon-800); border:1px solid var(--carbon-700); border-radius: var(--radius-xl); padding:1.25rem; }
.nearby-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
.nearby-toolbar h3 { color: var(--gold-600); margin:0; font-size:1.05rem; }
.controls { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.controls label { font-size:13px; color: var(--carbon-400); display:inline-flex; align-items:center; gap:6px; }
.controls select { background: var(--carbon-900); color: var(--carbon-50); border:1px solid var(--carbon-700); padding:4px 8px; border-radius:6px; }
.checkbox input { accent-color: var(--gold-500); }
.find-btn { background: var(--gold-500); color: var(--ink); border:none; padding:8px 14px; border-radius:6px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
.find-btn:disabled { opacity:.6; cursor:default; }
.find-btn:hover:not(:disabled) { background: var(--gold-400); }
.error { color:#e57373; font-size:13px; }
.empty { color: var(--carbon-400); font-size:13px; text-align:center; padding:1rem; }
</style>
