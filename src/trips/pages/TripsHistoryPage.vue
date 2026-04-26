<template>
  <div class="trips-page">
    <div class="page-header">
      <h1 class="page-title">Historial de <span class="gold">Viajes</span></h1>
      <p class="page-sub">Tus últimos viajes realizados</p>
    </div>

    <div v-if="isLoading" class="skeleton-list">
      <div v-for="i in 5" :key="i" class="sk-row shimmer"></div>
    </div>

    <div v-else-if="trips.length > 0" class="trips-list">
      <div
        v-for="(trip, i) in trips"
        :key="trip.id"
        class="trip-row"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <div class="trip-icon"><i class="pi pi-directions"></i></div>
        <div class="trip-info">
          <h3>{{ trip.routeName || 'Ruta desconocida' }}</h3>
          <p>{{ trip.origin }} → {{ trip.destination }}</p>
        </div>
        <div class="trip-meta">
          <span class="trip-date">{{ formatDate(trip.date) }}</span>
          <span class="trip-price">S/ {{ trip.price }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-map"></i>
      <p>No tienes viajes registrados</p>
      <span>Tus viajes aparecerán aquí una vez uses la plataforma</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TripService } from '@/trips/services/trip.service.js'

const trips     = ref([])
const isLoading = ref(false)
const svc = new TripService()

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  isLoading.value = true
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.id) trips.value = await svc.getTripsByUserId(user.id)
  } catch { /* TODO: endpoint pendiente */ }
  finally { isLoading.value = false }
})
</script>

<style scoped>
.trips-page { padding: 2rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-400); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

.trips-list { display: flex; flex-direction: column; gap: 10px; }
.trip-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 1rem 1.5rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  animation: fadeUp 0.35s var(--ease-out-expo) both;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.trip-icon {
  width: 40px; height: 40px;
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-500);
  flex-shrink: 0;
}
.trip-info { flex: 1; }
.trip-info h3 { font-size: 0.9rem; font-weight: 600; color: var(--carbon-100); }
.trip-info p { font-size: 0.8rem; color: var(--carbon-400); margin-top: 2px; }
.trip-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.trip-date { font-size: 0.75rem; color: var(--carbon-500); }
.trip-price { font-size: 0.9rem; font-weight: 700; color: var(--gold-400); }

.skeleton-list { display: flex; flex-direction: column; gap: 10px; }
.sk-row { height: 68px; background: var(--carbon-800); border-radius: var(--radius-lg); }
.shimmer {
  background: linear-gradient(90deg, var(--carbon-700) 25%, var(--carbon-600) 50%, var(--carbon-700) 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 4rem 2rem; color: var(--carbon-500); text-align: center;
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-400); }
.empty-state span { font-size: 0.85rem; }
</style>
