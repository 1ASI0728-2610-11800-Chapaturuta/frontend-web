<template>
  <div class="trips-page">
    <div class="page-header">
      <h1 class="page-title">Gestión de <span class="gold">Viajes</span></h1>
      <p class="page-sub">Publica viajes con asientos, tómalos, inícialos y complétalos</p>
    </div>

    <!-- PUBLICAR VIAJE -->
    <section class="block publish-block">
      <h2 class="block-title"><i class="pi pi-megaphone"></i> Publicar viaje</h2>
      <div class="publish-form">
        <div class="pf-field">
          <label>Ruta</label>
          <select v-model="publishRouteId" class="pf-input">
            <option :value="null" disabled>Selecciona una ruta…</option>
            <option v-for="r in routes" :key="r.id" :value="r.id">
              {{ routeOptionLabel(r) }}
            </option>
          </select>
        </div>
        <div class="pf-field">
          <label>Fecha y hora</label>
          <input v-model="publishStartTime" type="datetime-local" class="pf-input" />
        </div>
        <div class="pf-field seats">
          <label>Asientos</label>
          <div class="pf-input pf-readonly" title="Capacidad de tu vehículo (registro)">
            <i class="pi pi-users"></i> {{ vehicleCapacity ?? '—' }}
          </div>
        </div>
        <button class="act-btn act-start pf-btn" :disabled="publishing || !publishRouteId || !vehicleCapacity || !!publishScheduleError" @click="publish">
          <i class="pi pi-megaphone"></i> {{ publishing ? 'Publicando…' : 'Publicar' }}
        </button>
      </div>
      <small v-if="publishScheduleError" class="field-error">{{ publishScheduleError }}</small>
      <p class="pf-hint">Los asientos se toman de la capacidad de tu vehículo registrado. Para cambiarla, edita tu vehículo en tu perfil.</p>
      <p v-if="!routes.length && !loadingRoutes" class="pf-hint">No tienes rutas. Crea una en "Rutas" primero.</p>
    </section>

    <!-- VIAJES DISPONIBLES -->
    <section class="block">
      <h2 class="block-title"><i class="pi pi-inbox"></i> Viajes disponibles</h2>

      <div v-if="loadingAvailable" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="sk-row shimmer"></div>
      </div>

      <div v-else-if="available.length > 0" class="trips-list">
        <div v-for="(trip, i) in available" :key="trip.id" class="trip-row" :style="{ animationDelay: `${i * 40}ms` }">
          <div class="trip-icon"><i class="pi pi-directions"></i></div>
          <div class="trip-info">
            <h3>{{ trip.routeName || 'Ruta desconocida' }}</h3>
            <p>{{ originLabel(trip) }} → {{ destinationLabel(trip) }}</p>
            <p class="trip-people">
              <span v-if="trip.passengerName"><i class="pi pi-users"></i> {{ trip.passengerName }}</span>
            </p>
          </div>
          <div class="trip-meta">
            <span class="status-badge st-pending">{{ statusLabel(trip.status) }}</span>
            <span class="seats-badge"><i class="pi pi-users"></i> {{ trip.availableSeats }} asientos</span>
            <span class="trip-date">{{ formatDateTime(trip.startTime) }}</span>
            <span class="trip-price">S/ {{ trip.price ?? '—' }}</span>
            <div class="trip-actions">
              <button class="act-btn act-start" :disabled="acting === trip.id" @click="takeTrip(trip)">
                <i class="pi pi-check-square"></i> Tomar viaje
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state small">
        <i class="pi pi-inbox"></i>
        <p>No hay viajes disponibles por ahora</p>
      </div>
    </section>

    <!-- MIS VIAJES -->
    <section class="block">
      <h2 class="block-title"><i class="pi pi-car"></i> Mis viajes</h2>

      <div v-if="loadingMine" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="sk-row shimmer"></div>
      </div>

      <div v-else-if="mine.length > 0" class="trips-list">
        <div v-for="(trip, i) in mine" :key="trip.id" class="trip-row" :style="{ animationDelay: `${i * 40}ms` }">
          <div class="trip-icon"><i class="pi pi-directions"></i></div>
          <div class="trip-info">
            <h3>{{ trip.routeName || 'Ruta desconocida' }}</h3>
            <p>{{ originLabel(trip) }} → {{ destinationLabel(trip) }}</p>
            <p class="trip-people">
              <span v-if="trip.passengerName"><i class="pi pi-users"></i> {{ trip.passengerName }}</span>
            </p>
          </div>
          <div class="trip-meta">
            <span class="status-badge" :class="statusClass(trip.status)">{{ statusLabel(trip.status) }}</span>
            <span class="seats-badge"><i class="pi pi-users"></i> {{ trip.availableSeats }} asientos</span>
            <span class="trip-date">{{ formatDateTime(trip.startTime) }}</span>
            <span class="trip-price">S/ {{ trip.price ?? '—' }}</span>
            <div class="trip-actions">
              <button
                v-if="normalizeStatus(trip.status) === 'pending'"
                class="act-btn act-start" :disabled="acting === trip.id" @click="doAction(trip, 'start')"
              ><i class="pi pi-play"></i> Iniciar</button>
              <button
                v-if="normalizeStatus(trip.status) === 'inprogress'"
                class="act-btn act-complete" :disabled="acting === trip.id" @click="doAction(trip, 'complete')"
              ><i class="pi pi-check"></i> Completar</button>
              <button
                v-if="['pending','inprogress'].includes(normalizeStatus(trip.status))"
                class="act-btn act-cancel" :disabled="acting === trip.id" @click="doAction(trip, 'cancel')"
              ><i class="pi pi-times"></i> Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state small">
        <i class="pi pi-car"></i>
        <p>Aún no has tomado viajes</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { TripService } from '@/trips/services/trip.service.js'
import { RouteService } from '@/network/services/route.service.js'
import { DriverService } from '@/driver/services/driver.service.js'
import { getDriverId, getUserId } from '@/shared/services/session.service.js'
import { formatLima, limaLocalInputToUtcIso, validateAgainstSchedules } from '@/shared/services/lima-time.js'

const svc = new TripService()
const routeSvc = new RouteService()
const driverSvc = new DriverService()
const toast = useToast()

const available = ref([])
const mine = ref([])
const loadingAvailable = ref(false)
const loadingMine = ref(false)
const acting = ref(null)

// Publicar viaje
const routes = ref([])
const loadingRoutes = ref(false)
const publishRouteId = ref(null)
const vehicleCapacity = ref(null) // capacidad del vehículo registrado (única fuente de asientos)
const publishing = ref(false)
const publishStartTime = ref('') // valor del <input type="datetime-local"> (hora de Lima)

// La ruta elegida trae sus horarios de atención (schedules) para validar en cliente.
const publishRoute = computed(() => routes.value.find(r => r.id === publishRouteId.value) || null)
const publishScheduleError = computed(() => {
  if (!publishStartTime.value) return null
  const [datePart, timePart] = publishStartTime.value.split('T')
  if (!datePart || !timePart) return null
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const result = validateAgainstSchedules(publishRoute.value?.schedules, { year, month: month - 1, day, hour, minute })
  return result.valid ? null : result.message
})

// Lee la capacidad del vehículo del perfil del conductor; es la fuente de asientos al publicar.
const loadVehicleCapacity = async () => {
  const userId = getUserId()
  if (!userId) return
  try {
    const driver = await driverSvc.getDriverByUserId(userId)
    vehicleCapacity.value = driver?.vehicleCapacity ?? driver?.vehicle?.capacity ?? driver?.capacity ?? null
  } catch {
    vehicleCapacity.value = null
  }
}

const routeOptionLabel = (r) => {
  const stops = r.stops || []
  const origin = stops[0]?.name
  const dest = stops[stops.length - 1]?.name
  const path = origin && dest ? `${origin} → ${dest}` : `Ruta #${r.id}`
  return `${path} · S/ ${r.price}`
}

const loadRoutes = async () => {
  const driverId = getDriverId()
  if (!driverId) return
  loadingRoutes.value = true
  try {
    routes.value = await routeSvc.loadRoutesByDriverId(driverId)
  } catch {
    routes.value = []
  } finally {
    loadingRoutes.value = false
  }
}

const publish = async () => {
  const driverId = getDriverId()
  const route = routes.value.find(r => r.id === publishRouteId.value)
  if (!driverId || !route) return
  const stops = route.stops || []
  if (stops.length < 2) {
    toast.add({ severity: 'warn', summary: 'Ruta inválida', detail: 'La ruta necesita origen y destino.', life: 4000 })
    return
  }
  if (publishScheduleError.value) {
    toast.add({ severity: 'warn', summary: 'Horario inválido', detail: publishScheduleError.value, life: 4000 })
    return
  }
  publishing.value = true
  try {
    // El backend fija los asientos desde la capacidad del vehículo; enviamos la conocida solo informativa.
    await svc.publishTrip({
      fkIdDriver: driverId,
      fkIdRoute: route.id,
      fkIdOriginStop: stops[0].id,
      fkIdDestinationStop: stops[stops.length - 1].id,
      price: route.price,
      seats: vehicleCapacity.value,
      startTime: limaLocalInputToUtcIso(publishStartTime.value)
    })
    toast.add({ severity: 'success', summary: 'Viaje publicado', detail: `${vehicleCapacity.value} asientos disponibles`, life: 3000 })
    publishRouteId.value = null
    publishStartTime.value = ''
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.data?.message || e?.friendlyMessage || 'No se pudo publicar el viaje.', life: 4000 })
  } finally {
    publishing.value = false
  }
}

const originLabel = (t) => t.originName || t.origin || ''
const destinationLabel = (t) => t.destinationName || t.destination || ''

const formatDateTime = (value) => {
  if (!value) return ''
  return formatLima(value, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const normalizeStatus = (s) => String(s ?? '').toLowerCase().replace(/[\s_]/g, '')
const statusClass = (s) => ({
  pending: 'st-pending', inprogress: 'st-progress', completed: 'st-completed',
  cancelled: 'st-cancelled', canceled: 'st-cancelled'
}[normalizeStatus(s)] || 'st-pending')
const statusLabel = (s) => ({
  pending: 'Pendiente', inprogress: 'En curso', completed: 'Completado',
  cancelled: 'Cancelado', canceled: 'Cancelado'
}[normalizeStatus(s)] || (s || 'Pendiente'))

const loadAvailable = async () => {
  loadingAvailable.value = true
  try {
    available.value = await svc.getAvailableTrips()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.data?.message || 'No se pudieron cargar los viajes disponibles.', life: 4000 })
  } finally {
    loadingAvailable.value = false
  }
}

const loadMine = async () => {
  const driverId = getDriverId()
  if (!driverId) return
  loadingMine.value = true
  try {
    mine.value = await svc.getTripHistoryByDriverId(driverId)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.data?.message || 'No se pudieron cargar tus viajes.', life: 4000 })
  } finally {
    loadingMine.value = false
  }
}

const load = async () => { await Promise.all([loadAvailable(), loadMine(), loadRoutes(), loadVehicleCapacity()]) }

const takeTrip = async (trip) => {
  const driverId = getDriverId()
  if (!driverId) {
    toast.add({ severity: 'warn', summary: 'Sin perfil de conductor', detail: 'Completa tu registro de conductor primero.', life: 4000 })
    return
  }
  acting.value = trip.id
  try {
    await svc.assignDriver(trip.id, driverId)
    toast.add({ severity: 'success', summary: 'Viaje tomado', life: 2500 })
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.data?.message || 'No se pudo tomar el viaje.', life: 4000 })
  } finally {
    acting.value = null
  }
}

const doAction = async (trip, action) => {
  acting.value = trip.id
  try {
    if (action === 'start') await svc.startTrip(trip.id)
    else if (action === 'complete') await svc.completeTrip(trip.id)
    else if (action === 'cancel') await svc.cancelTrip(trip.id)
    toast.add({ severity: 'success', summary: 'Viaje actualizado', life: 2500 })
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.data?.message || 'No se pudo actualizar el viaje.', life: 4000 })
  } finally {
    acting.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.trips-page { display: flex; flex-direction: column; gap: 2rem; }
.page-header { margin-bottom: 0.25rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-500); }
.page-sub { color: var(--carbon-400); margin-top: 0.25rem; }

.block { display: flex; flex-direction: column; gap: 1rem; }
.block-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 600; color: var(--carbon-100); }
.block-title i { color: var(--gold-500); }

.trips-list { display: flex; flex-direction: column; gap: 0.75rem; }
.trip-row {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--carbon-850, #1a1a1a);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  animation: fadeUp 0.35s ease both;
}
.trip-icon {
  width: 42px; height: 42px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  background: rgba(139,92,246,0.12); border: 1px solid var(--gold-500); color: var(--gold-500);
}
.trip-info { flex: 1; min-width: 0; }
.trip-info h3 { font-size: 1rem; font-weight: 600; color: var(--carbon-50); }
.trip-info p { font-size: 0.85rem; color: var(--carbon-400); margin-top: 2px; }
.trip-people { display: flex; gap: 1rem; }
.trip-people span { display: inline-flex; align-items: center; gap: 4px; }

.trip-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.status-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 8px; border-radius: 999px; }
.st-pending { background: rgba(139,92,246,0.15); color: var(--gold-500); }
.st-progress { background: rgba(96,165,250,0.15); color: #60a5fa; }
.st-completed { background: rgba(74,222,128,0.15); color: #4ade80; }
.st-cancelled { background: rgba(248,113,113,0.15); color: #f87171; }
.trip-date { font-size: 0.75rem; color: var(--carbon-500); }
.trip-price { font-size: 0.95rem; font-weight: 700; color: var(--gold-500); }
.seats-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 600; color: #60a5fa; background: rgba(96,165,250,0.12); padding: 2px 8px; border-radius: 999px; }

/* Publicar viaje */
.publish-block { background: var(--carbon-850, #1a1a1a); border: 1px solid var(--carbon-700); border-radius: var(--radius-md); padding: 1.1rem 1.25rem; }
.publish-form { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.pf-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 200px; }
.pf-field.seats { flex: 0 0 110px; min-width: 90px; }
.pf-field label { font-size: 0.78rem; color: var(--carbon-400); }
.pf-input { padding: 9px 12px; background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-sm); color: var(--carbon-100); font-size: 0.9rem; font-family: var(--font-family); }
.pf-input:focus { outline: none; border-color: var(--gold-500); }
.pf-readonly { display: inline-flex; align-items: center; gap: 6px; color: var(--gold-500); background: var(--carbon-900, #14151a); cursor: default; }
.pf-btn { white-space: nowrap; }
.pf-hint { font-size: 0.8rem; color: var(--carbon-500); margin-top: 8px; }
.field-error { color: #e5484d; font-size: 12px; display: block; margin-top: 6px; }

.trip-actions { display: flex; gap: 6px; margin-top: 4px; }
.act-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; font-size: 0.8rem; font-weight: 600;
  border: none; border-radius: var(--radius-sm); cursor: pointer;
  font-family: var(--font-family);
}
.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.act-start { background: var(--gold-500); color: var(--carbon-950); }
.act-complete { background: #4ade80; color: #0a2912; }
.act-cancel { background: rgba(248,113,113,0.15); color: #f87171; }

.skeleton-list { display: flex; flex-direction: column; gap: 0.75rem; }
.sk-row { height: 74px; border-radius: var(--radius-md); background: var(--carbon-800); }
.shimmer { position: relative; overflow: hidden; }
.shimmer::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
  animation: shimmer 1.4s infinite;
}

.empty-state { text-align: center; padding: 2.5rem 1rem; color: var(--carbon-400); }
.empty-state.small { padding: 1.5rem 1rem; }
.empty-state i { font-size: 1.75rem; color: var(--carbon-600); display: block; margin-bottom: 0.5rem; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer { to { transform: translateX(100%); } }
</style>
