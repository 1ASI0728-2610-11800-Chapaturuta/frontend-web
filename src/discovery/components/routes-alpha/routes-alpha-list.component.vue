<script>
import { ConductorService } from '@/conductor/services/conductor.service.js'
import RouteAlphaCard from "./route-alpha-card.component.vue";

export default {
  name: "routes-alpha-list",
  components: { RouteAlphaCard },
  data() {
    return { routesWithCompanyNames: [] }
  },
  props: {
    routes:    { type: Array,   required: true },
    isLoading: { type: Boolean, default: false },
    error:     { type: String,  default: null }
  },
  watch: {
    routes: {
      immediate: true,
      async handler(newRoutes) {
        if (newRoutes && newRoutes.length > 0) {
          await this.processRoutes(newRoutes)
        } else {
          this.routesWithCompanyNames = []
        }
      }
    }
  },
  methods: {
    async processRoutes(routes) {
      // El concepto "empresa" fue refactorizado a "conductor": el nombre proviene del driver de la parada.
      const svc = new ConductorService()
      const results = await Promise.all(
        routes.map(async (route) => {
          try {
            const driverId = route.stops?.[0]?.fk_driver_id
            const driver = await svc.getById(driverId)
            const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ').trim()
            return { ...route, companyName: name || 'Conductor' }
          } catch {
            return { ...route, companyName: 'Conductor' }
          }
        })
      )
      this.routesWithCompanyNames = results
    }
  }
}
</script>

<template>
  <div class="list-container">

    <div v-if="isLoading" class="skeleton-grid">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <div class="sk-image shimmer"></div>
        <div class="sk-body">
          <div class="sk-line shimmer" style="width: 80%"></div>
          <div class="sk-line shimmer" style="width: 55%"></div>
          <div class="sk-stats shimmer"></div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="empty-state error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="routesWithCompanyNames.length > 0" class="routes-grid">
      <route-alpha-card
        v-for="(route, i) in routesWithCompanyNames"
        :key="route.id"
        :route="route"
        :companyName="route.companyName"
        :style="{ animationDelay: `${i * 50}ms` }"
        class="card-appear"
      />
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-map"></i>
      <p>No hay rutas disponibles</p>
      <span>Intenta con otro distrito o elimina el filtro</span>
    </div>

  </div>
</template>

<style scoped>
.list-container { width: 100%; }

.routes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.card-appear {
  animation: fadeUp 0.4s var(--ease-out-expo) both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.skeleton-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.skeleton-card {
  width: 280px;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.sk-image { height: 160px; }
.sk-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 10px; }
.sk-line { height: 12px; border-radius: 6px; }
.sk-stats { height: 28px; border-radius: 6px; margin-top: 4px; }

.shimmer {
  background: linear-gradient(90deg, var(--carbon-700) 25%, var(--carbon-600) 50%, var(--carbon-700) 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4rem 2rem;
  color: var(--carbon-500);
  text-align: center;
  width: 100%;
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-400); }
.empty-state span { font-size: 0.85rem; }
.error-state { color: var(--danger); }
.error-state i { color: var(--danger); opacity: 0.7; }
</style>
