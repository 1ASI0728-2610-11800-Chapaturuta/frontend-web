<script>
import RoutesAlphaList   from "@/discovery/components/routes-alpha/routes-alpha-list.component.vue";
import RoutesAlphaFilter from "@/discovery/components/routes-alpha/routes-alpha-filter.component.vue";
import RoutesSearchBar   from "@/discovery/components/routes-alpha/routes-search-bar.component.vue";
import NearbyStops       from "@/discovery/components/nearby-stops.component.vue";
import { routeAlphaService } from "@/discovery/services/route-alpha.service.js";
import { DistrictService }  from "@/geography/services/district.service.js";
import { RegionService }    from "@/geography/services/region.service.js";
import { ProvinceService }  from "@/geography/services/province.service.js";

export default {
  name: "routes-alpha-dashboard",
  components: { RoutesAlphaList, RoutesAlphaFilter, RoutesSearchBar, NearbyStops },
  data() {
    return {
      regions:   [],
      provinces: [],
      districts: [],
      routes:    [],
      searchQuery: { origin: '', destination: '' },
      isLoading: false,
      error:     null
    }
  },
  computed: {
    visibleRoutes() {
      const origin = (this.searchQuery.origin || '').trim().toLowerCase()
      const dest   = (this.searchQuery.destination || '').trim().toLowerCase()
      if (!origin && !dest) return this.routes
      return this.routes.filter(route => {
        const stops = route.stops || []
        if (!stops.length) return false
        const first = stops[0]
        const last  = stops[stops.length - 1]
        const firstText = `${first?.name || ''} ${first?.address || ''}`.toLowerCase()
        const lastText  = `${last?.name || ''} ${last?.address || ''}`.toLowerCase()
        const okOrigin = !origin || firstText.includes(origin)
        const okDest   = !dest   || lastText.includes(dest)
        return okOrigin && okDest
      })
    }
  },
  methods: {
    async loadRoutes() {
      this.isLoading = true
      this.error = null
      try {
        this.routes = await routeAlphaService.getAll()
      } catch (err) {
        this.error = `Error cargando rutas: ${err.message}`
        this.$toast?.add({ severity: 'error', summary: 'Error', detail: this.error })
      } finally {
        this.isLoading = false
      }
    },
    async loadGeographicData() {
      try {
        const [regions, provinces, districts] = await Promise.all([
          new RegionService().getAll(),
          new ProvinceService().getAll(),
          new DistrictService().getAll()
        ])
        this.regions   = regions
        this.provinces = provinces
        this.districts = districts
      } catch (err) {
        this.$toast?.add({ severity: 'error', summary: 'Error de Carga', detail: err.message, life: 3000 })
      }
    },
    async loadFilteredRoutes(districtId) {
      this.isLoading = true
      this.error = null
      try {
        this.routes = await routeAlphaService.getRoutesByDistrictId(districtId)
      } catch (err) {
        this.error = `Error filtrando rutas: ${err.message}`
        this.$toast?.add({ severity: 'error', summary: 'Error', detail: this.error })
      } finally {
        this.isLoading = false
      }
    },
    async handleBuscar(districtId) {
      if (districtId) await this.loadFilteredRoutes(districtId)
      else await this.loadRoutes()
    },
    async handleBorrar() {
      await this.loadRoutes()
    }
  },
  mounted() {
    this.loadRoutes()
    this.loadGeographicData()
  }
}
</script>

<template>
  <div class="dashboard">

    <div class="hero-section">
      <div class="hero-text">
        <h1 class="hero-title">Descubre <span class="gold">rutas</span> en tu ciudad</h1>
        <p class="hero-sub">Encuentra el transporte urbano más conveniente para tu destino</p>
      </div>
      <div class="hero-stats">
        <div class="stat-pill">
          <i class="pi pi-map-marker"></i>
          <span>{{ visibleRoutes.length }} rutas</span>
        </div>
      </div>
    </div>

    <routes-search-bar v-model="searchQuery" />

    <routes-alpha-filter
      :regions="regions"
      :provinces="provinces"
      :districts="districts"
      @buscar="handleBuscar"
      @borrar="handleBorrar"
    />

    <div class="results-header" v-if="!isLoading && visibleRoutes.length > 0">
      <span class="results-count">{{ visibleRoutes.length }} rutas encontradas</span>
    </div>

    <routes-alpha-list :routes="visibleRoutes" :isLoading="isLoading" :error="error" />

    <nearby-stops />

  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 1.5rem 2rem 3rem;
  max-width: 1280px;
  margin: 0 auto;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg, var(--carbon-800) 0%, var(--carbon-850, #181818) 100%);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  border-bottom: 3px solid var(--gold-500);
}
.hero-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.hero-title .gold { color: var(--gold-400); }
.hero-sub { font-size: 0.95rem; color: var(--carbon-400); margin-top: 6px; }
.hero-stats { display: flex; gap: 12px; }
.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gold-400);
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.results-count {
  font-size: 13px;
  color: var(--carbon-400);
  font-weight: 500;
}
</style>
