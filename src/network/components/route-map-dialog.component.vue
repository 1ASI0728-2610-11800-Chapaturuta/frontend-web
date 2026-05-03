<script setup>
import { ref, watch } from 'vue'
import MapWithMarkers from '@/shared/components/MapWithMarkers.vue'
import { RouteService } from '@/network/services/route.service.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  route: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const polyline = ref([])
const loading = ref(false)
const error = ref(null)

watch(() => props.modelValue, async (open) => {
  if (!open || !props.route?.id) return
  loading.value = true
  error.value = null
  try {
    polyline.value = await new RouteService().getGeometry(props.route.id)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const stopMarkers = () => (props.route?.stops || [])
  .filter(s => s.latitude != null && s.longitude != null)
  .map(s => ({ id: s.id, name: s.name, latitude: s.latitude, longitude: s.longitude, address: s.address }))
</script>

<template>
  <pb-Dialog :visible="modelValue" @update:visible="emit('update:modelValue', $event)" modal :style="{ width: '60rem' }">
    <template #header><h2 style="color: var(--gold-400)">Ruta en el mapa</h2></template>
    <div v-if="loading" style="padding:2rem;text-align:center;">Cargando geometría…</div>
    <div v-else-if="error" style="padding:1rem;color:#e57373;">{{ error }}</div>
    <MapWithMarkers v-else :stops="stopMarkers()" :polyline="polyline" height="500px" />
  </pb-Dialog>
</template>
