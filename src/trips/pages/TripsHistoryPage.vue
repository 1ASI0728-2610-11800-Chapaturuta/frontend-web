<template>
  <div class="trips-page">
    <div class="page-header">
      <h1 class="page-title">Historial de <span class="gold">Viajes</span></h1>
      <p class="page-sub">Tus ultimos viajes realizados</p>
    </div>

    <!-- Cargando: skeleton reutilizable -->
    <div v-if="isLoading" class="trips-list">
      <div v-for="i in 5" :key="i" class="trip-row sk-card">
        <SkeletonLoader width="40px" height="40px" radius="12px" />
        <div class="sk-stack">
          <SkeletonLoader width="60%" height="14px" />
          <SkeletonLoader width="40%" height="12px" />
        </div>
        <SkeletonLoader width="64px" height="22px" radius="9999px" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state error">
      <i class="pi pi-exclamation-triangle"></i>
      <p>No se pudo cargar el historial</p>
      <span>{{ error }}</span>
    </div>

    <!-- Lista de viajes -->
    <div v-else-if="trips.length > 0" class="trips-list">
      <div
        v-for="(trip, i) in trips"
        :key="trip.id"
        class="trip-row"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <div class="trip-icon"><i class="pi pi-directions"></i></div>

        <div class="trip-info">
          <h3>Viaje #{{ trip.id }}</h3>
          <p class="trip-times">
            <i class="pi pi-calendar"></i>
            {{ formatDateTime(trip.startTime) }}
            <template v-if="trip.endTime">
              <span class="arrow">&rarr;</span>{{ formatTime(trip.endTime) }}
            </template>
          </p>
          <p class="trip-seats">
            <i class="pi pi-users"></i>
            {{ trip.availableSeats }} {{ trip.availableSeats === 1 ? 'asiento' : 'asientos' }} disponibles
          </p>
        </div>

        <div class="trip-meta">
          <span class="status-badge" :class="statusClass(trip.status)">
            {{ statusLabel(trip.status) }}
          </span>
          <span class="trip-price">{{ formatPrice(trip.price) }}</span>
        </div>
      </div>
    </div>

    <!-- Vacio -->
    <div v-else class="empty-state">
      <i class="pi pi-map"></i>
      <p>No tienes viajes registrados</p>
      <span>Tus viajes apareceran aqui una vez uses la plataforma</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TripService } from '@/trips/services/trip.service.js'
import { Trip, TRIP_STATUS } from '@/trips/models/trip.entity.js'
import SkeletonLoader from '@/shared/components/SkeletonLoader.vue'

const trips     = ref([])
const isLoading = ref(false)
const error     = ref('')
const svc = new TripService()

// ── Etiquetas y estilos por status ──
const STATUS_LABELS = {
  [TRIP_STATUS.PENDING]:     'Pendiente',
  [TRIP_STATUS.IN_PROGRESS]: 'En curso',
  [TRIP_STATUS.COMPLETED]:   'Completado',
  [TRIP_STATUS.CANCELLED]:   'Cancelado'
}
const statusLabel = (s) => STATUS_LABELS[s] || s || 'Desconocido'
const statusClass = (s) => `st-${(s || 'unknown').toLowerCase()}`

// ── Formateadores ──
const formatDateTime = (v) => {
  if (!v) return 'Sin fecha'
  return new Date(v).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
const formatTime = (v) => {
  if (!v) return ''
  return new Date(v).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
const formatPrice = (p) => (p == null ? 'S/ —' : `S/ ${Number(p).toFixed(2)}`)

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.id) {
      trips.value = []
      return
    }
    const data = await svc.getByUser(user.id)
    trips.value = (Array.isArray(data) ? data : []).map((t) => new Trip(t))
  } catch (e) {
    error.value = e?.message || 'Error inesperado'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.trips-page { padding: 2rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-100); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-600); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

.trips-list { display: flex; flex-direction: column; gap: 10px; }
.trip-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  animation: fadeUp 0.35s var(--ease-out-expo) both;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.trip-icon {
  width: 40px; height: 40px;
  background: var(--gold-100);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-600);
  flex-shrink: 0;
}

.trip-info { flex: 1; min-width: 0; }
.trip-info h3 { font-size: 0.95rem; font-weight: 600; color: var(--carbon-100); }
.trip-times, .trip-seats {
  font-size: 0.8rem; color: var(--carbon-400); margin-top: 4px;
  display: flex; align-items: center; gap: 6px;
}
.trip-times i, .trip-seats i { font-size: 0.75rem; color: var(--carbon-500); }
.trip-times .arrow { margin: 0 2px; color: var(--carbon-500); }

.trip-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.trip-price { font-size: 0.95rem; font-weight: 700; color: var(--gold-600); }

/* ── Badge de status (colores semanticos del tema claro) ── */
.status-badge {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
  padding: 4px 10px; border-radius: var(--radius-full);
  border: 1px solid transparent; white-space: nowrap;
}
.st-pending     { color: var(--warning); background: rgba(224,169,46,0.12); border-color: rgba(224,169,46,0.30); }
.st-inprogress  { color: var(--info);    background: rgba(76,141,246,0.12); border-color: rgba(76,141,246,0.30); }
.st-completed   { color: var(--success); background: rgba(59,174,110,0.12); border-color: rgba(59,174,110,0.30); }
.st-cancelled   { color: var(--danger);  background: rgba(226,86,107,0.12); border-color: rgba(226,86,107,0.30); }
.st-unknown     { color: var(--carbon-400); background: var(--carbon-800); border-color: var(--carbon-700); }

/* ── Skeleton card (usa SkeletonLoader compartido) ── */
.sk-card { animation: none; }
.sk-stack { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* ── Estados vacio / error ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 4rem 2rem; color: var(--carbon-500); text-align: center;
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-400); }
.empty-state span { font-size: 0.85rem; }
.empty-state.error i { color: var(--danger); }
.empty-state.error p { color: var(--danger); }
</style>
