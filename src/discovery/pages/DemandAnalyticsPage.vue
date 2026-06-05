<script>
import { discoveryService } from '@/discovery/services/discovery.service.js'
import { DistrictService }  from '@/geography/services/district.service.js'
import QuotaUpsellBanner    from '@/discovery/components/quota-upsell-banner.component.vue'

/**
 * Lee el id del usuario autenticado desde localStorage (`user.id`).
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

const DAY_LABELS = {
  Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles',
  Thursday: 'Jueves', Friday: 'Viernes', Saturday: 'Sábado', Sunday: 'Domingo'
}

export default {
  name: 'demand-analytics-page',
  components: { QuotaUpsellBanner },
  data() {
    return {
      districts:     [],
      selectedDistrict: null,   // id de distrito (null = todos)
      period:        null,      // opcional; backend default 'all'
      analytics:     null,
      isLoading:     false,
      error:         null,
      quotaExceeded: false
    }
  },
  computed: {
    districtOptions() {
      return [
        { id: null, name: 'Todos los distritos' },
        ...this.districts.map(d => ({ id: d.id, name: d.name }))
      ]
    },
    hourRows() {
      const rows = this.analytics?.demandByHour || []
      return rows.map(r => ({ ...r, label: `${String(r.hour).padStart(2, '0')}:00` }))
    },
    dayRows() {
      const rows = this.analytics?.demandByDay || []
      return rows.map(r => ({ ...r, label: DAY_LABELS[r.day] || r.day }))
    },
    maxHourCount() {
      return this.hourRows.reduce((m, r) => Math.max(m, r.count || 0), 0) || 1
    },
    maxDayCount() {
      return this.dayRows.reduce((m, r) => Math.max(m, r.count || 0), 0) || 1
    }
  },
  methods: {
    async loadDistricts() {
      try {
        this.districts = await new DistrictService().getAll()
      } catch (err) {
        // No es bloqueante: el selector queda solo con "Todos".
        this.$toast?.add({ severity: 'warn', summary: 'Distritos', detail: err.message, life: 2500 })
      }
    },
    async loadAnalytics() {
      const userId = currentUserId()
      if (!userId) {
        this.error = 'Inicia sesión para ver la analítica de demanda.'
        return
      }
      this.isLoading = true
      this.error = null
      this.quotaExceeded = false
      try {
        this.analytics = await discoveryService.analyticsDemand({
          userId,
          districtId: this.selectedDistrict ?? undefined,
          period: this.period ?? undefined
        })
      } catch (err) {
        if (err?.isQuotaExceeded) {
          this.quotaExceeded = true
          this.analytics = null
        } else {
          this.error = `Error cargando analítica: ${err.message}`
          this.$toast?.add({ severity: 'error', summary: 'Error', detail: this.error, life: 3000 })
        }
      } finally {
        this.isLoading = false
      }
    },
    barWidth(count, max) {
      return `${Math.round(((count || 0) / max) * 100)}%`
    }
  },
  mounted() {
    this.loadDistricts()
    this.loadAnalytics()
  }
}
</script>

<template>
  <div class="analytics">

    <header class="analytics-hero">
      <div>
        <h1 class="title">Analítica de <span class="accent">demanda</span></h1>
        <p class="subtitle">Distribución de viajes por hora y por día de la semana</p>
      </div>
      <div v-if="analytics" class="total-pill">
        <i class="pi pi-chart-bar"></i>
        <span>{{ analytics.totalTrips }} viajes</span>
      </div>
    </header>

    <section class="filters">
      <label class="field">
        <span class="field-label">Distrito</span>
        <pb-Select
          v-model="selectedDistrict"
          :options="districtOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos los distritos"
          class="pb-Select field-control"
        />
      </label>
      <pb-Button
        label="Aplicar"
        icon="pi pi-filter"
        class="pb-Button apply-btn"
        :loading="isLoading"
        @click="loadAnalytics"
      />
    </section>

    <quota-upsell-banner
      v-if="quotaExceeded"
      plansRoute="/conductor/suscription"
    />

    <div v-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i> Cargando analítica…
    </div>

    <template v-else-if="analytics && !quotaExceeded">
      <!-- Demanda por hora: barras CSS + tabla -->
      <section class="panel">
        <h2 class="panel-title"><i class="pi pi-clock"></i> Demanda por hora</h2>

        <div v-if="hourRows.length" class="bar-chart">
          <div v-for="row in hourRows" :key="`h-${row.hour}`" class="bar-row">
            <span class="bar-label">{{ row.label }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: barWidth(row.count, maxHourCount) }"></div>
            </div>
            <span class="bar-value">{{ row.count }}</span>
          </div>
        </div>

        <pb-DataTable :value="hourRows" class="pb-DataTable" responsiveLayout="scroll" :rows="12" paginator>
          <pb-Column field="label"  header="Hora" />
          <pb-Column field="count"  header="Viajes" />
        </pb-DataTable>
      </section>

      <!-- Demanda por día de la semana -->
      <section class="panel">
        <h2 class="panel-title"><i class="pi pi-calendar"></i> Demanda por día</h2>

        <div v-if="dayRows.length" class="bar-chart">
          <div v-for="row in dayRows" :key="`d-${row.day}`" class="bar-row">
            <span class="bar-label wide">{{ row.label }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: barWidth(row.count, maxDayCount) }"></div>
            </div>
            <span class="bar-value">{{ row.count }}</span>
          </div>
        </div>

        <pb-DataTable :value="dayRows" class="pb-DataTable" responsiveLayout="scroll">
          <pb-Column field="label" header="Día" />
          <pb-Column field="count" header="Viajes" />
        </pb-DataTable>
      </section>

      <div v-if="!hourRows.length && !dayRows.length" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>No hay datos de demanda para este filtro</p>
      </div>
    </template>

  </div>
</template>

<style scoped>
.analytics {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 2rem 3rem;
  max-width: 1100px;
  margin: 0 auto;
}

.analytics-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.75rem 2rem;
  background: linear-gradient(135deg, var(--surface) 0%, var(--lilac-100) 100%);
  border: 1px solid var(--carbon-700);
  border-bottom: 3px solid var(--gold-500);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}
.title { font-size: 1.8rem; font-weight: 700; color: var(--ink); letter-spacing: -0.03em; }
.title .accent { color: var(--gold-600); }
.subtitle { font-size: 0.9rem; color: var(--carbon-400); margin-top: 4px; }
.total-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--lilac-100);
  border: 1px solid var(--gold-500);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--gold-600);
}

.filters {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.8rem; font-weight: 600; color: var(--carbon-400); }
.field-control { min-width: 240px; }
.apply-btn { align-self: flex-end; }

.panel {
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink);
}
.panel-title i { color: var(--gold-600); }

.bar-chart { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label {
  width: 56px;
  flex: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--carbon-300);
  text-align: right;
}
.bar-label.wide { width: 88px; }
.bar-track {
  flex: 1;
  height: 14px;
  background: var(--carbon-700);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--gradient-gold);
  border-radius: var(--radius-full);
  transition: width var(--duration-normal) var(--ease-out-expo);
}
.bar-value {
  width: 40px;
  flex: none;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gold-600);
  text-align: left;
}

.error-state,
.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 2rem;
  color: var(--carbon-400);
  font-size: 0.9rem;
}
.error-state { color: var(--danger); }
.empty-state { flex-direction: column; }
.empty-state i { font-size: 2rem; color: var(--carbon-600); }
</style>
