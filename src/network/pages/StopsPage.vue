<script>
import StopsHeaderTitle from "@/network/components/stops-header-title.component.vue";
import stopsList from "@/network/components/stops-list.component.vue";
import MapWithMarkers from "@/shared/components/MapWithMarkers.vue";
import { StopService } from "@/network/services/stop.service.js";

export default {
  components: {
    StopsHeaderTitle,
    stopsList,
    MapWithMarkers
  },
  data() {
    return {
      stops: [],
      isLoading: false,
      error: null,
      view: 'list'
    };
  },

  methods: {
    async loadStops() {
      this.isLoading = true;
      this.error = null;
      try {
        const service = new StopService();
        const companyId = JSON.parse(localStorage.getItem("user")).companyId;
        this.stops = await service.getStopsByCompanyId(companyId);
      } catch (err) {
        this.error = `Error al cargar paraderos: ${err.message}`;
        this.$toast.add({ severity: 'error', summary: 'Error', detail: this.error });
      } finally {
        this.isLoading = false;
      }
    },
    async handleUpdated() { await this.loadStops(); },
    async handleDeleted() { await this.loadStops(); },
    async handleCreated() { await this.loadStops(); }
  },
  mounted() {
    this.loadStops();
  }
}
</script>

<template>
  <div class="stops-page">
    <stops-header-title @created="handleCreated"/>
    <div class="view-toggle">
      <button :class="{ active: view === 'list' }" @click="view = 'list'">
        <i class="pi pi-list"></i> Lista
      </button>
      <button :class="{ active: view === 'map' }" @click="view = 'map'">
        <i class="pi pi-map"></i> Mapa
      </button>
    </div>
    <stops-list
      v-if="view === 'list'"
      :stops="stops"
      :isLoading="isLoading"
      :error="error"
      @updated="handleUpdated"
      @deleted="handleDeleted"
    />
    <MapWithMarkers v-else :stops="stops" height="520px" />
  </div>
</template>

<style scoped>
.stops-page { display: flex; flex-direction: column; gap: 1rem; }
.view-toggle { display: inline-flex; gap: 6px; background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: 8px; padding: 4px; width: fit-content; }
.view-toggle button {
  background: transparent; border: none; color: var(--carbon-400); cursor: pointer;
  padding: 6px 14px; border-radius: 6px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;
}
.view-toggle button.active { background: rgba(201,168,76,0.15); color: var(--gold-400); }
.view-toggle button:hover:not(.active) { color: var(--carbon-50); }
</style>
