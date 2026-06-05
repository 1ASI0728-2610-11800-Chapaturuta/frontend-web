<script>
import { TripService } from "@/trips/services/trip.service.js";

export default {
  name: "route-complete-detail",
  props: {
    routeId: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      route: null,
      loading: true,
      error: null,
      booking: false,
      tripService: new TripService()
    };
  },
  computed: {
    user() {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}');
      } catch {
        return {};
      }
    },
    isPassenger() {
      return this.user && this.user.id != null && this.user.role === 0;
    },
    originStop() {
      return this.route?.stops?.[0] || null;
    },
    destinationStop() {
      const stops = this.route?.stops || [];
      return stops.length ? stops[stops.length - 1] : null;
    }
  },
  created() {
    try {
      this.loading = true;
      const raw = this.$route?.query?.routeData;
      if (raw) {
        this.route = JSON.parse(raw);
      } else {
        this.error = 'No se encontraron datos de la ruta.';
      }
    } catch (error) {
      console.error('Error parsing route details:', error);
      this.error = 'No se pudieron cargar los detalles de la ruta.';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDuration(minutes) {
      if (minutes == null) return '';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins > 0 ? mins + 'min' : ''}` : `${mins}min`;
    },
    async bookTrip() {
      if (!this.route || !this.originStop || !this.destinationStop) {
        this.$toast?.add({ severity: 'warn', summary: 'Sin datos', detail: 'La ruta no tiene paraderos válidos.', life: 3000 });
        return;
      }
      this.booking = true;
      try {
        await this.tripService.createTrip({
          fkIdRoute: this.route.id,
          fkIdOriginStop: this.originStop.id,
          fkIdDestinationStop: this.destinationStop.id,
          price: this.route.price
        });
        this.$toast?.add({ severity: 'success', summary: 'Viaje registrado', detail: 'Tu viaje fue registrado correctamente.', life: 3000 });
        this.$router.push({ name: 'TripHistory' });
      } catch (err) {
        const detail = err?.data?.message || err?.message || 'No se pudo registrar el viaje.';
        this.$toast?.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
      } finally {
        this.booking = false;
      }
    }
  }
};
</script>

<template>
  <div class="route-complete-detail">
    <div v-if="loading" class="loading-state">
      <p>Cargando detalles de la ruta...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>
    <div v-else-if="route" class="detail-content">
      <div class="detail-header">
        <h1 class="detail-title">
          {{ originStop?.name }} <span class="arrow">→</span> {{ destinationStop?.name }}
        </h1>
        <span class="detail-stops-count">{{ route.stops?.length || 0 }} paraderos</span>
      </div>

      <div class="detail-stats">
        <div class="stat">
          <i class="pi pi-clock"></i>
          <span>{{ formatDuration(route.duration) }} de viaje</span>
        </div>
        <div class="stat">
          <i class="pi pi-money-bill"></i>
          <span>S/ {{ route.price }}</span>
        </div>
      </div>

      <div class="stops-list">
        <div v-for="(stop, i) in route.stops" :key="stop.id || i" class="stop-item">
          <i class="pi pi-map-marker"></i>
          <div class="stop-text">
            <span class="stop-name">{{ stop.name }}</span>
            <span class="stop-address">{{ stop.address }}</span>
          </div>
        </div>
      </div>

      <div v-if="isPassenger" class="book-action">
        <pb-Button
          label="Hacer viaje"
          icon="pi pi-directions"
          :loading="booking"
          @click="bookTrip"
        />
        <p class="book-hint">
          Origen: <strong>{{ originStop?.name }}</strong> · Destino: <strong>{{ destinationStop?.name }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-complete-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
.loading-state, .error-state {
  padding: 3rem;
  text-align: center;
  color: var(--carbon-400);
}
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--carbon-50);
}
.detail-title .arrow { color: var(--gold-600); }
.detail-stops-count {
  font-size: 0.8rem;
  color: var(--carbon-400);
}
.detail-stats {
  display: flex;
  gap: 1.5rem;
}
.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gold-600);
}
.stat i { color: var(--carbon-400); }
.stops-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.stop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
}
.stop-item i { color: var(--gold-500); }
.stop-text { display: flex; flex-direction: column; }
.stop-name { font-size: 0.9rem; font-weight: 600; color: var(--carbon-100); }
.stop-address { font-size: 0.8rem; color: var(--carbon-400); }
.book-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0.5rem;
}
.book-hint { font-size: 0.8rem; color: var(--carbon-400); }
</style>
