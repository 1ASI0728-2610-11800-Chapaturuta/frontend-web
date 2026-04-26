<script>
export default {
  name: "routes-alpha-filter",
  emits: ['buscar', 'borrar'],
  data() {
    return {
      selectedRegion:   null,
      selectedProvince: null,
      selectedDistrict: null,
    }
  },
  props: {
    regions:   { type: Array, required: true },
    provinces: { type: Array, required: true },
    districts: { type: Array, required: true }
  },
  computed: {
    filteredProvinces() {
      if (!this.selectedRegion) return []
      return this.provinces.filter(p => p.fkIdRegion === this.selectedRegion.id)
    },
    filteredDistricts() {
      if (!this.selectedProvince) return []
      return this.districts.filter(d => d.fkIdProvince === this.selectedProvince.id)
    }
  },
  watch: {
    selectedRegion()   { this.selectedProvince = null; this.selectedDistrict = null },
    selectedProvince() { this.selectedDistrict = null }
  },
  methods: {
    clearFilter() {
      this.selectedRegion = null
      this.selectedProvince = null
      this.selectedDistrict = null
    },
    emitBuscar() {
      if (this.selectedDistrict) this.$emit('buscar', this.selectedDistrict.id)
    },
    emitBorrar() {
      this.clearFilter()
      this.$emit('borrar')
    }
  }
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-label">
      <i class="pi pi-filter"></i>
      Filtrar por zona
    </div>

    <div class="filter-selects">
      <pb-IftaLabel>
        <pb-Select
          v-model="selectedRegion"
          :options="regions"
          optionLabel="name"
          placeholder="Región"
          inputId="region"
          class="dark-select"
        />
        <label for="region">Región</label>
      </pb-IftaLabel>

      <pb-IftaLabel>
        <pb-Select
          v-model="selectedProvince"
          :options="filteredProvinces"
          optionLabel="name"
          placeholder="Provincia"
          inputId="province"
          :disabled="!selectedRegion"
          class="dark-select"
        />
        <label for="province">Provincia</label>
      </pb-IftaLabel>

      <pb-IftaLabel>
        <pb-Select
          v-model="selectedDistrict"
          :options="filteredDistricts"
          optionLabel="name"
          placeholder="Distrito"
          inputId="district"
          :disabled="!selectedProvince"
          class="dark-select"
        />
        <label for="district">Distrito</label>
      </pb-IftaLabel>
    </div>

    <div class="filter-actions">
      <button class="btn-search" :disabled="!selectedDistrict" @click="emitBuscar">
        <i class="pi pi-search"></i>
        Buscar
      </button>
      <button class="btn-clear" @click="emitBorrar">
        <i class="pi pi-times"></i>
        Limpiar
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
}
.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--carbon-400);
  white-space: nowrap;
  flex-shrink: 0;
}
.filter-selects {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}
.dark-select {
  --p-select-background: var(--carbon-900);
  --p-select-border-color: var(--carbon-600);
  --p-select-hover-border-color: var(--gold-500);
  --p-select-focus-border-color: var(--gold-500);
  --p-select-color: var(--carbon-100);
  --p-select-placeholder-color: var(--carbon-500);
  --p-select-dropdown-color: var(--carbon-400);
  --p-iftalabel-color: var(--carbon-500);
  --p-iftalabel-focus-color: var(--gold-500);
  width: 200px;
}
.filter-actions { display: flex; gap: 8px; margin-left: auto; }
.btn-search {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 20px;
  background: var(--gradient-gold);
  border: none;
  border-radius: var(--radius-md);
  color: var(--carbon-950);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-family);
  cursor: pointer;
  transition: opacity var(--duration-fast) ease;
}
.btn-search:hover:not(:disabled) { opacity: 0.88; }
.btn-search:disabled { background: var(--carbon-700); color: var(--carbon-500); cursor: not-allowed; }
.btn-clear {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px;
  background: transparent;
  border: 1px solid var(--carbon-600);
  border-radius: var(--radius-md);
  color: var(--carbon-400);
  font-size: 13px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: border-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.btn-clear:hover { border-color: var(--danger); color: var(--danger); }
</style>
