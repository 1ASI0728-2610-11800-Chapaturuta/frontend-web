<script setup>
import { onMounted, ref } from 'vue'
import { CurrencyDollarIcon, MapPinIcon, StopCircleIcon, ClockIcon } from '@heroicons/vue/24/solid/index.js'
import KPICard from '@/driver/components/KPICard.vue'
import { DriverService } from '@/driver/services/driver.service.js'
import { StopService } from '@/network/services/stop.service.js'
import { RouteService } from '@/network/services/route.service.js'
import { getCurrentUser, getDriverId, saveCurrentUser } from '@/shared/services/session.service.js'

const driverName = ref('conductor')
const vehicle = ref('Vehiculo no registrado')
const totalStops = ref('0')
const totalRoutes = ref('0')
const averageFare = ref('S/ 0.00')
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  const user = getCurrentUser()
  const driverService = new DriverService()
  const stopService = new StopService()
  const routeService = new RouteService()
  try {
    let driverId = getDriverId()
    let driver = null
    if (driverId) driver = await driverService.getById(driverId)
    else if (user.id) {
      driver = await driverService.getDriverByUserId(user.id)
      driverId = driver.id
      saveCurrentUser({ ...user, driverId })
    }
    if (driver) {
      driverName.value = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || user.username || 'conductor'
      vehicle.value = [driver.vehicleBrand, driver.vehicleModel, driver.vehiclePlate].filter(Boolean).join(' - ') || vehicle.value
    }
    if (driverId) {
      const [stops, routes] = await Promise.all([
        stopService.getStopsByDriverId(driverId).catch(() => []),
        routeService.loadRoutesByDriverId(driverId).catch(() => [])
      ])
      totalStops.value = stops.length
      totalRoutes.value = routes.length
      const prices = routes.map(r => Number(r.price)).filter(n => !Number.isNaN(n))
      if (prices.length) averageFare.value = `S/ ${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home-page">
    <div class="welcome-section">
      <div>
        <h1 class="welcome-title">Bienvenido, <span class="gold">{{ driverName }}</span></h1>
        <p class="welcome-sub">{{ vehicle }}</p>
      </div>
      <div class="welcome-badge">
        <i class="pi pi-id-card"></i>
        Panel Conductor
      </div>
    </div>

    <section class="section">
      <h2 class="section-title">Resumen General</h2>
      <div class="kpi-grid">
        <KPICard :icon="CurrencyDollarIcon" :value="averageFare" label="Tarifa promedio" />
        <KPICard :icon="MapPinIcon" :value="totalStops" label="Total paraderos" />
        <KPICard :icon="StopCircleIcon" :value="totalRoutes" label="Total rutas" />
        <KPICard :icon="ClockIcon" :value="loading ? '...' : 'OSRM'" label="Routing activo" />
      </div>
    </section>

    <section class="quick-grid">
      <router-link to="/driver/information" class="quick-card">
        <i class="pi pi-user-edit"></i>
        <div>
          <h3>Editar perfil</h3>
          <p>Actualiza tus datos personales y de vehiculo.</p>
        </div>
      </router-link>
      <router-link to="/driver/payments" class="quick-card">
        <i class="pi pi-wallet"></i>
        <div>
          <h3>Pagos</h3>
          <p>Revisa pagos asociados a reservas y suscripciones.</p>
        </div>
      </router-link>
      <router-link to="/driver/subscriptions" class="quick-card">
        <i class="pi pi-star"></i>
        <div>
          <h3>Planes</h3>
          <p>Consulta el plan Premium disponible.</p>
        </div>
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: 2rem; }
.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.75rem 2rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--gold-500);
}
.welcome-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); }
.welcome-title .gold { color: var(--gold-400); }
.welcome-sub { color: var(--carbon-400); margin-top: 4px; }
.welcome-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: var(--radius-md);
  padding: 8px 16px;
  color: var(--gold-400);
  font-size: 13px;
  font-weight: 600;
}
.section { display: flex; flex-direction: column; gap: 1rem; }
.section-title { color: var(--carbon-200); font-weight: 600; font-size: 1.125rem; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.quick-card {
  display: flex;
  gap: 1rem;
  text-decoration: none;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  color: var(--carbon-200);
}
.quick-card:hover { border-color: var(--gold-500); }
.quick-card i { color: var(--gold-500); font-size: 1.25rem; margin-top: 2px; }
.quick-card h3 { font-size: 1rem; margin-bottom: 4px; }
.quick-card p { color: var(--carbon-400); font-size: 0.85rem; }
@media (max-width: 900px) { .kpi-grid, .quick-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .kpi-grid, .quick-grid { grid-template-columns: 1fr; } }
</style>
