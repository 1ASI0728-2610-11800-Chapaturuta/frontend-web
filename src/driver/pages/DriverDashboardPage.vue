<template>
  <div class="dashboard-page">
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Dashboard <span class="gold">Premium</span></h1>
        <p class="dash-sub">Analítica detallada de tu operación{{ driverName ? ` · ${driverName}` : '' }}</p>
      </div>
      <span class="premium-badge"><i class="pi pi-crown"></i> Premium</span>
    </div>

    <!-- Cargando estado premium -->
    <div v-if="premiumLoading || (isPremium && loading)" class="state-card">
      <span class="spinner"></span> Cargando analítica...
    </div>

    <!-- No premium: teaser bloqueado + upsell -->
    <div v-else-if="!isPremium" class="upsell-card">
      <div class="lock-circle"><i class="pi pi-lock"></i></div>
      <h2>Función exclusiva Premium</h2>
      <p>
        El Dashboard con KPIs personalizados y la analítica con IA están disponibles
        solo para conductores con el <strong>plan Premium activo</strong>.
      </p>
      <ul class="perk-list">
        <li><i class="pi pi-check-circle"></i> KPIs en tiempo real (viajes, ingresos, reputación)</li>
        <li><i class="pi pi-check-circle"></i> Predicción de demanda con IA</li>
        <li><i class="pi pi-check-circle"></i> Rutas y paraderos ilimitados</li>
        <li><i class="pi pi-check-circle"></i> Tus rutas aparecen primero en la búsqueda</li>
      </ul>
      <router-link to="/driver/subscriptions" class="upsell-btn">
        <i class="pi pi-bolt"></i> Pasar a Premium
      </router-link>
    </div>

    <!-- Premium: dashboard real -->
    <template v-else>
      <!-- KPIs -->
      <section class="section">
        <h2 class="section-title">KPIs del conductor</h2>
        <div class="kpi-grid">
          <KPICard :icon="TruckIcon" :value="kpis.totalTrips" label="Viajes totales" />
          <KPICard :icon="TicketIcon" :value="kpis.totalReservations" label="Reservas" />
          <KPICard :icon="StarIcon" :value="kpis.avgRating" label="Calificación promedio" />
          <KPICard :icon="CurrencyDollarIcon" :value="kpis.revenue" label="Ingresos estimados" />
          <KPICard :icon="MapIcon" :value="kpis.totalRoutes" label="Rutas activas" />
          <KPICard :icon="MapPinIcon" :value="kpis.totalStops" label="Paraderos" />
          <KPICard :icon="UsersIcon" :value="kpis.occupancy" label="Ocupación promedio" />
          <KPICard :icon="CheckBadgeIcon" :value="kpis.completionRate" label="Viajes completados" />
        </div>
      </section>

      <!-- Analítica IA (fake) -->
      <section class="section">
        <div class="ia-head">
          <h2 class="section-title">Predicción de demanda <span class="ia-tag">IA</span></h2>
          <span class="ia-note">Estimaciones generadas a partir de tu historial (demo)</span>
        </div>

        <div class="ia-insights">
          <div class="insight" v-for="(ins, i) in insights" :key="i">
            <i :class="ins.icon"></i>
            <div>
              <strong>{{ ins.title }}</strong>
              <span>{{ ins.detail }}</span>
            </div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <h3>Demanda por hora</h3>
            <pb-Chart type="bar" :data="hourChart" :options="chartOptions" class="chart" />
          </div>
          <div class="chart-card">
            <h3>Demanda por día</h3>
            <pb-Chart type="bar" :data="dayChart" :options="chartOptions" class="chart" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  TruckIcon, TicketIcon, StarIcon, CurrencyDollarIcon,
  MapIcon, MapPinIcon, UsersIcon, CheckBadgeIcon
} from '@heroicons/vue/24/solid/index.js'
import KPICard from '@/driver/components/KPICard.vue'
import { usePremiumStatus } from '@/shared/composables/usePremiumStatus.js'
import { DriverService } from '@/driver/services/driver.service.js'
import { StopService } from '@/network/services/stop.service.js'
import { RouteService } from '@/network/services/route.service.js'
import { TripService } from '@/trips/services/trip.service.js'
import { ReservationService } from '@/reservations/services/reservation.service.js'
import { RatingService } from '@/ratings/services/rating.service.js'
import { getCurrentUser, getDriverId, saveCurrentUser } from '@/shared/services/session.service.js'

const { isPremium, loading: premiumLoading, loaded: premiumLoaded } = usePremiumStatus()

const loading = ref(false)
const driverName = ref('')
const trips = ref([])
const reservations = ref([])
const ratingSummary = ref(null)
const routesCount = ref(0)
const stopsCount = ref(0)

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

async function resolveDriverId() {
  const user = getCurrentUser()
  let driverId = getDriverId()
  if (driverId) return driverId
  if (user.id) {
    const driver = await new DriverService().getDriverByUserId(user.id)
    driverId = driver.id
    saveCurrentUser({ ...user, driverId })
    driverName.value = `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
  }
  return driverId
}

async function load() {
  loading.value = true
  try {
    const driverId = await resolveDriverId()
    if (!driverId) return
    if (!driverName.value) {
      try {
        const d = await new DriverService().getById(driverId)
        driverName.value = `${d.firstName || ''} ${d.lastName || ''}`.trim()
      } catch { /* opcional */ }
    }
    const [tripsRes, resRes, ratingRes, routesRes, stopsRes] = await Promise.all([
      new TripService().getTripHistoryByDriverId(driverId).catch(() => []),
      new ReservationService().getByDriver(driverId).catch(() => []),
      new RatingService().getDriverSummary(driverId).catch(() => null),
      new RouteService().loadRoutesByDriverId(driverId).catch(() => []),
      new StopService().getStopsByDriverId(driverId).catch(() => [])
    ])
    trips.value = Array.isArray(tripsRes) ? tripsRes : []
    reservations.value = Array.isArray(resRes) ? resRes : []
    ratingSummary.value = ratingRes
    routesCount.value = Array.isArray(routesRes) ? routesRes.length : 0
    stopsCount.value = Array.isArray(stopsRes) ? stopsRes.length : 0
  } finally {
    loading.value = false
  }
}

// Cargar los datos solo cuando confirmamos que es premium.
watch([premiumLoaded, isPremium], ([loaded, premium]) => {
  if (loaded && premium && !trips.value.length && !loading.value) load()
}, { immediate: true })

const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s_]/g, '')

const kpis = computed(() => {
  const t = trips.value
  const completed = t.filter(x => norm(x.status) === 'completed')
  const revenue = completed.reduce((a, x) => a + (Number(x.price) || 0), 0)
  const seats = reservations.value.reduce((a, r) => a + (Number(r.seats) || 0), 0)
  const confirmedRes = reservations.value.filter(r => ['confirmed', 'completed'].includes(norm(r.status))).length
  const avg = ratingSummary.value?.averageRating ?? ratingSummary.value?.average ?? ratingSummary.value?.rating ?? 0
  return {
    totalTrips: t.length,
    totalReservations: reservations.value.length,
    avgRating: Number(avg) ? `${Number(avg).toFixed(1)} / 5` : '—',
    revenue: `S/ ${revenue.toFixed(2)}`,
    totalRoutes: routesCount.value,
    totalStops: stopsCount.value,
    occupancy: t.length ? `${(seats / t.length).toFixed(1)} asientos` : '—',
    completionRate: t.length ? `${Math.round((completed.length / t.length) * 100)}%` : '—',
    _confirmedRes: confirmedRes
  }
})

// ── Demanda por hora / día (del historial de viajes) ─────────────────────────
const byHour = computed(() => {
  const buckets = Array(24).fill(0)
  for (const t of trips.value) {
    const d = new Date(t.startTime || t.date)
    if (!Number.isNaN(d.getTime())) buckets[d.getHours()]++
  }
  return buckets
})
const byDay = computed(() => {
  const buckets = Array(7).fill(0)
  for (const t of trips.value) {
    const d = new Date(t.startTime || t.date)
    if (!Number.isNaN(d.getTime())) buckets[d.getDay()]++
  }
  return buckets
})

const GOLD = '#c9a84c'
const hourChart = computed(() => ({
  labels: Array.from({ length: 24 }, (_, h) => `${h}h`),
  datasets: [{ label: 'Viajes', data: byHour.value, backgroundColor: GOLD, borderRadius: 4 }]
}))
const dayChart = computed(() => ({
  labels: DAYS,
  datasets: [{ label: 'Viajes', data: byDay.value, backgroundColor: GOLD, borderRadius: 4 }]
}))
const chartOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#9aa0ab' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#9aa0ab', precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
  },
  maintainAspectRatio: false
}

// ── Insights "IA" (heurísticas deterministas) ────────────────────────────────
const insights = computed(() => {
  const hours = byHour.value
  const days = byDay.value
  const total = trips.value.length
  const peakHour = hours.indexOf(Math.max(...hours))
  const peakDay = days.indexOf(Math.max(...days))
  const hasData = total > 0
  // "Predicción" determinista: crecimiento proporcional a la concentración en hora pico.
  const peakShare = hasData ? hours[peakHour] / total : 0
  const growth = hasData ? Math.round(8 + peakShare * 30) : 12

  return [
    {
      icon: 'pi pi-clock',
      title: hasData ? `Hora pico: ${peakHour}:00 – ${peakHour + 1}:00` : 'Hora pico: sin datos aún',
      detail: hasData ? `Concentra el ${Math.round(peakShare * 100)}% de tus viajes. Refuerza tu disponibilidad en ese horario.` : 'Registra viajes para ver tu hora de mayor demanda.'
    },
    {
      icon: 'pi pi-calendar',
      title: hasData ? `Día más demandado: ${DAYS[peakDay]}` : 'Día más demandado: sin datos',
      detail: hasData ? 'Prioriza tus rutas activas este día para captar más pasajeros.' : 'La IA necesita historial para estimar el mejor día.'
    },
    {
      icon: 'pi pi-chart-line',
      title: `Demanda proyectada: +${growth}%`,
      detail: 'Estimación de crecimiento para el próximo ciclo según tu tendencia reciente.'
    }
  ]
})
</script>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 1.75rem; }
.dash-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.dash-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); }
.dash-title .gold { color: var(--gold-400); }
.dash-sub { color: var(--carbon-400); margin-top: 4px; font-size: 0.9rem; }
.premium-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--gradient-gold); color: var(--carbon-950);
  font-weight: 800; font-size: 0.8rem; padding: 6px 14px; border-radius: 999px;
}

.state-card {
  min-height: 160px; background: var(--carbon-800); border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
  gap: 10px; color: var(--carbon-400);
}

/* Upsell */
.upsell-card {
  background: linear-gradient(180deg, rgba(201,168,76,0.07), var(--carbon-800) 60%);
  border: 1px solid rgba(201,168,76,0.35); border-radius: var(--radius-xl);
  padding: 2.5rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.85rem;
}
.lock-circle {
  width: 72px; height: 72px; border-radius: 50%; background: rgba(201,168,76,0.12);
  display: flex; align-items: center; justify-content: center; color: var(--gold-400); font-size: 32px;
}
.upsell-card h2 { color: var(--carbon-50); font-size: 1.4rem; font-weight: 800; }
.upsell-card p { color: var(--carbon-400); max-width: 520px; font-size: 0.92rem; line-height: 1.5; }
.upsell-card p strong { color: var(--gold-300); }
.perk-list { list-style: none; display: flex; flex-direction: column; gap: 8px; margin: 0.5rem 0; text-align: left; }
.perk-list li { display: flex; align-items: center; gap: 9px; color: var(--carbon-200); font-size: 0.9rem; }
.perk-list i { color: var(--gold-400); }
.upsell-btn {
  margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 8px;
  background: var(--gradient-gold); color: var(--carbon-950); font-weight: 800;
  padding: 12px 26px; border-radius: var(--radius-md); text-decoration: none;
}

.section { display: flex; flex-direction: column; gap: 1rem; }
.section-title { color: var(--carbon-200); font-weight: 600; font-size: 1.125rem; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

.ia-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.ia-tag { background: rgba(96,165,250,0.15); color: #93c5fd; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; vertical-align: middle; }
.ia-note { color: var(--carbon-500); font-size: 0.78rem; }
.ia-insights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.insight {
  display: flex; gap: 10px; align-items: flex-start;
  background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-lg); padding: 1rem 1.1rem;
}
.insight i { color: var(--gold-400); font-size: 18px; margin-top: 2px; }
.insight strong { display: block; color: var(--carbon-100); font-size: 0.9rem; }
.insight span { color: var(--carbon-400); font-size: 0.8rem; line-height: 1.4; }

.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.chart-card { background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-lg); padding: 1.25rem; }
.chart-card h3 { color: var(--carbon-200); font-size: 0.95rem; margin-bottom: 0.75rem; }
.chart { height: 240px; }

.spinner { width: 16px; height: 16px; border: 2px solid var(--gold-400); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1000px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .ia-insights, .charts-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .kpi-grid { grid-template-columns: 1fr; } }
</style>
