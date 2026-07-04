<script>
import StopsHeaderTitle from "@/network/components/stops-header-title.component.vue";
import stopsList from "@/network/components/stops-list.component.vue";
import MapWithMarkers from "@/shared/components/MapWithMarkers.vue";
import { StopService } from "@/network/services/stop.service.js";
import { SubscriptionService } from "@/subscriptions/services/subscription.service.js";
import { getDriverId, getUserId } from "@/shared/services/session.service.js";

const BASIC_MAX_STOPS = 30;

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
      view: 'list',
      isPremium: false
    };
  },

  computed: {
    canCreateStop() {
      return this.isPremium || this.stops.length < BASIC_MAX_STOPS;
    },
    limitMessage() {
      return `Plan Básico: máximo ${BASIC_MAX_STOPS} paraderos. Pasa a Premium para ilimitados.`;
    }
  },

  methods: {
    async loadPremium() {
      try {
        const userId = getUserId();
        if (!userId) return;
        const res = await new SubscriptionService().getPremiumStatus(userId);
        this.isPremium = !!res?.isPremium;
      } catch { this.isPremium = false; }
    },
    async loadStops() {
      this.isLoading = true;
      this.error = null;
      try {
        const service = new StopService();
        const driverId = getDriverId();
        if (!driverId) {
          this.error = 'Primero completa tu perfil de conductor para gestionar paraderos.';
          this.stops = [];
          return;
        }
        this.stops = await service.getStopsByDriverId(driverId);
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
    this.loadPremium();
  }
}
</script>

<template>
  <div class="stops-page">
    <stops-header-title :can-create="canCreateStop" :limit-message="limitMessage" @created="handleCreated"/>
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
.view-toggle button.active { background: rgba(139,92,246,0.15); color: var(--gold-400); }
.view-toggle button:hover:not(.active) { color: var(--carbon-50); }
</style>
