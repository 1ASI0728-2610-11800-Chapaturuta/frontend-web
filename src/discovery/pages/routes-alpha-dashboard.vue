<script>
import RoutesAlphaList   from "@/discovery/components/routes-alpha/routes-alpha-list.component.vue";
import RoutesAlphaFilter from "@/discovery/components/routes-alpha/routes-alpha-filter.component.vue";
import RoutesSearchBar   from "@/discovery/components/routes-alpha/routes-search-bar.component.vue";
import NearbyStops       from "@/discovery/components/nearby-stops.component.vue";
import QuotaUpsellBanner from "@/discovery/components/quota-upsell-banner.component.vue";
import { routeAlphaService } from "@/discovery/services/route-alpha.service.js";
import { discoveryService } from "@/discovery/services/discovery.service.js";
import { DistrictService }  from "@/geography/services/district.service.js";
import { RegionService }    from "@/geography/services/region.service.js";
import { ProvinceService }  from "@/geography/services/province.service.js";

/**
 * Lee el id del usuario autenticado desde localStorage (`user.id`),
 * usado para aplicar la cuota del plan en los endpoints de Discovery.
 * @returns {number|string|undefined}
 */
function currentUserId() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw)?.id : undefined
  } catch {
    return undefined
  }
}

export default {
  name: "routes-alpha-dashboard",
  components: { RoutesAlphaList, RoutesAlphaFilter, RoutesSearchBar, NearbyStops, QuotaUpsellBanner },
  data() {
    return {
      regions:   [],
      provinces: [],
      districts: [],
      routes:    [],
      searchQuery: '',
      isLoading: false,
      error:     null,
      // Estado de Discovery (search/popular con cuota de plan).
      quotaExceeded: false,
      mode:          'all'   // 'all' | 'search' | 'popular'
    }
  },
  computed: {
    visibleRoutes() {
      // En modo backend (search/popular) las rutas ya vienen filtradas.
      if (this.mode !== 'all') return this.routes
      const query = this.searchQuery.trim().toLowerCase()
      if (!query) return this.routes
      const tokens = query.split(/\s+/).filter(Boolean)
      return this.routes.filter(route => {
        const haystack = (route.stops || [])
          .map(s => `${s.name || ''} ${s.address || ''}`)
          .join(' ')
          .toLowerCase()
        return tokens.every(token => haystack.includes(token))
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
        // El backend responde 404 ("No routes found.") cuando no hay rutas:
        // lo tratamos como lista vacía, no como error.
        if (err?.status === 404) {
          this.routes = []
        } else {
          this.error = `Error cargando rutas: ${err.message}`
          this.$toast?.add({ severity: 'error', summary: 'Error', detail: this.error })
        }
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
        // 404 = no hay rutas en ese distrito → lista vacía, no error.
        if (err?.status === 404) {
          this.routes = []
        } else {
          this.error = `Error filtrando rutas: ${err.message}`
          this.$toast?.add({ severity: 'error', summary: 'Error', detail: this.error })
        }
      } finally {
        this.isLoading = false
      }
    },
    async handleBuscar(districtId) {
      this.mode = 'all'
      if (districtId) await this.loadFilteredRoutes(districtId)
      else await this.loadRoutes()
    },
    async handleBorrar() {
      this.mode = 'all'
      await this.loadRoutes()
    },
    /**
     * Búsqueda por origen/destino contra el backend (Discovery /search).
     * Consume cuota del plan; el texto del search-bar se usa como origen
     * y, si contiene un separador "→"/" a "/" - ", lo divide origen→destino.
     */
    async handleSearchBackend() {
      const raw = this.searchQuery.trim()
      if (!raw) { this.mode = 'all'; return }

      const userId = currentUserId()
      if (!userId) {
        this.error = 'Inicia sesión para usar la búsqueda de Discovery.'
        return
      }

      const { origin, destination } = this._parseQuery(raw)
      this.mode = 'search'
      this.isLoading = true
      this.error = null
      this.quotaExceeded = false
      try {
        // searchRoutes desenvuelve { route, ... } y deja el shape de routes-alpha-list.
        this.routes = await discoveryService.searchRoutes({ userId, origin, destination })
      } catch (err) {
        this._handleDiscoveryError(err, 'Error en la búsqueda')
      } finally {
        this.isLoading = false
      }
    },
    /**
     * Carga las rutas más populares (Discovery /popular). Consume cuota.
     */
    async handlePopular() {
      const userId = currentUserId()
      if (!userId) {
        this.error = 'Inicia sesión para ver las rutas populares.'
        return
      }
      this.mode = 'popular'
      this.searchQuery = ''
      this.isLoading = true
      this.error = null
      this.quotaExceeded = false
      try {
        this.routes = await discoveryService.popular({ userId, limit: 10 })
      } catch (err) {
        this._handleDiscoveryError(err, 'Error cargando populares')
      } finally {
        this.isLoading = false
      }
    },
    /** Vuelve al listado completo (modo 'all'). */
    async resetToAll() {
      this.mode = 'all'
      this.quotaExceeded = false
      this.searchQuery = ''
      await this.loadRoutes()
    },
    /** Divide el texto libre en origen/destino si trae un separador común. */
    _parseQuery(raw) {
      const sep = raw.split(/\s*(?:→|->| a | - )\s*/i)
      if (sep.length >= 2 && sep[0] && sep[1]) {
        return { origin: sep[0].trim(), destination: sep[1].trim() }
      }
      return { origin: raw, destination: undefined }
    },
    /** Maneja errores de Discovery distinguiendo la cuota agotada. */
    _handleDiscoveryError(err, fallbackSummary) {
      if (err?.isQuotaExceeded) {
        this.quotaExceeded = true
        this.routes = []
        this.error = null
      } else {
        this.error = `${fallbackSummary}: ${err.message}`
        this.$toast?.add({ severity: 'error', summary: 'Error', detail: this.error, life: 3000 })
      }
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

    <div class="search-row">
      <routes-search-bar v-model="searchQuery" class="search-grow" @keyup.enter="handleSearchBackend" />
      <div class="search-actions">
        <button class="action-btn primary" :disabled="isLoading" @click="handleSearchBackend">
          <i class="pi pi-search"></i> Buscar
        </button>
        <button
          class="action-btn"
          :class="{ active: mode === 'popular' }"
          :disabled="isLoading"
          @click="handlePopular"
        >
          <i class="pi pi-star"></i> Populares
        </button>
        <button
          v-if="mode !== 'all'"
          class="action-btn ghost"
          :disabled="isLoading"
          @click="resetToAll"
        >
          <i class="pi pi-times"></i> Ver todas
        </button>
      </div>
    </div>

    <routes-alpha-filter
      :regions="regions"
      :provinces="provinces"
      :districts="districts"
      @buscar="handleBuscar"
      @borrar="handleBorrar"
    />

    <quota-upsell-banner v-if="quotaExceeded" />

    <div class="results-header" v-if="!isLoading && visibleRoutes.length > 0">
      <span class="results-count">
        <template v-if="mode === 'popular'">{{ visibleRoutes.length }} rutas populares</template>
        <template v-else-if="mode === 'search'">{{ visibleRoutes.length }} resultados de búsqueda</template>
        <template v-else>{{ visibleRoutes.length }} rutas encontradas</template>
      </span>
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

.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.search-grow { flex: 1 1 320px; }
.search-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.7rem 1.1rem;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  color: var(--carbon-300);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color var(--duration-fast) ease, color var(--duration-fast) ease, background var(--duration-fast) ease;
}
.action-btn:hover:not(:disabled) { border-color: var(--gold-500); color: var(--gold-600); }
.action-btn:disabled { opacity: 0.6; cursor: default; }
.action-btn.primary {
  background: var(--gold-500);
  border-color: var(--gold-500);
  color: var(--ink);
}
.action-btn.primary:hover:not(:disabled) { background: var(--gold-400); border-color: var(--gold-400); color: var(--ink); }
.action-btn.active { border-color: var(--gold-600); color: var(--gold-600); background: var(--lilac-100); }
.action-btn.ghost { background: transparent; }

.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg, var(--carbon-800) 0%, var(--lilac-100) 100%);
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
.hero-title .gold { color: var(--gold-600); }
.hero-sub { font-size: 0.95rem; color: var(--carbon-400); margin-top: 6px; }
.hero-stats { display: flex; gap: 12px; }
.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(183,166,224,0.1);
  border: 1px solid rgba(183,166,224,0.3);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gold-600);
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
