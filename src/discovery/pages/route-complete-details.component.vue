<script>
import { TripService } from "@/trips/services/trip.service.js";
import { CollectionService } from "@/collections/services/collection.service.js";
import { RatingService } from "@/ratings/services/rating.service.js";
import { ReservationService } from "@/reservations/services/reservation.service.js";
import { RouteService } from "@/network/services/route.service.js";
import MapWithMarkers from "@/shared/components/MapWithMarkers.vue";
import StarRating from "@/shared/components/StarRating.vue";
import ScheduleDetailsItem from "@/discovery/components/route-details/schedule-details-item.component.vue";

export default {
  name: "route-complete-detail",
  components: { MapWithMarkers, StarRating, ScheduleDetailsItem },
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
      tripService: new TripService(),
      collectionService: new CollectionService(),
      ratingService: new RatingService(),
      reservationService: new ReservationService(),
      routeService: new RouteService(),
      collections: [],
      showCollectionPicker: false,
      selectedCollectionId: null,
      savingToCollection: false,
      driverSummary: null,
      eta: null,
      etaLoading: false,
      showReserve: false,
      reserving: false,
      reserveSeats: 1,
      reserveDocument: '',
      reservePaymentMethod: 'Card'
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
    driverId() {
      return this.route?.stops?.[0]?.fk_driver_id ?? this.route?.fkIdDriver ?? this.route?.driverId ?? null;
    },
    ratingAverage() {
      const s = this.driverSummary;
      return Math.round(Number(s?.averageRating ?? s?.average ?? s?.rating ?? 0));
    },
    ratingCount() {
      const s = this.driverSummary;
      return Number(s?.totalRatings ?? s?.count ?? s?.total ?? 0);
    },
    etaText() {
      const e = this.eta;
      if (!e) return null;
      const seconds = e.durationSeconds ?? (e.durationMinutes != null ? e.durationMinutes * 60 : e.etaMinutes != null ? e.etaMinutes * 60 : null);
      if (seconds == null) return null;
      const mins = Math.round(seconds / 60);
      return this.formatDuration(mins);
    },
    originStop() {
      return this.route?.stops?.[0] || null;
    },
    destinationStop() {
      const stops = this.route?.stops || [];
      return stops.length ? stops[stops.length - 1] : null;
    },
    mapStops() {
      return (this.route?.stops || [])
        .map(s => ({
          id: s.id,
          name: s.name,
          address: s.address,
          reference: s.reference,
          latitude: s.latitude ?? s.lat,
          longitude: s.longitude ?? s.lng
        }))
        .filter(s => Number.isFinite(+s.latitude) && Number.isFinite(+s.longitude));
    },
    polyline() {
      return this.mapStops.map(s => [+s.latitude, +s.longitude]);
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
    if (this.route) {
      this.loadRatingSummary();
      this.loadEta();
    }
  },
  methods: {
    async loadRatingSummary() {
      if (this.driverId == null) return;
      try {
        this.driverSummary = await this.ratingService.getDriverSummary(this.driverId);
      } catch {
        this.driverSummary = null;
      }
    },
    loadEta() {
      if (!this.route?.id || !navigator.geolocation) return;
      this.etaLoading = true;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            this.eta = await this.routeService.getEta(this.route.id, {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          } catch {
            this.eta = null;
          } finally {
            this.etaLoading = false;
          }
        },
        () => { this.etaLoading = false; },
        { timeout: 8000 }
      );
    },
    openReserve() {
      this.reserveSeats = 1;
      this.reserveDocument = '';
      this.reservePaymentMethod = 'Card';
      this.showReserve = true;
    },
    async confirmReserve() {
      if (!this.route || !this.originStop || !this.destinationStop) {
        this.$toast?.add({ severity: 'warn', summary: 'Sin datos', detail: 'La ruta no tiene paraderos válidos.', life: 3000 });
        return;
      }
      if (!this.reserveDocument) {
        this.$toast?.add({ severity: 'warn', summary: 'Documento requerido', detail: 'Ingresa tu número de documento.', life: 3000 });
        return;
      }
      this.reserving = true;
      try {
        const trip = await this.tripService.createTrip({
          fkIdRoute: this.route.id,
          fkIdOriginStop: this.originStop.id,
          fkIdDestinationStop: this.destinationStop.id,
          price: this.route.price,
          availableSeats: Number(this.reserveSeats)
        });
        const tripId = trip?.id ?? trip?.tripId;
        await this.reservationService.createReservation({
          fkIdUser: this.user.id,
          fkIdTrip: tripId,
          documentType: 'Dni',
          documentNumber: this.reserveDocument,
          seats: this.reserveSeats,
          paymentMethod: this.reservePaymentMethod
        });
        this.$toast?.add({ severity: 'success', summary: 'Reserva creada', detail: 'Tu reserva fue registrada correctamente.', life: 3000 });
        this.showReserve = false;
        this.$router.push({ name: 'Reservations' });
      } catch (err) {
        const detail = err?.data?.message || err?.message || 'No se pudo crear la reserva.';
        this.$toast?.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
      } finally {
        this.reserving = false;
      }
    },
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
    },
    async openCollectionPicker() {
      this.showCollectionPicker = true;
      try {
        this.collections = await this.collectionService.getCollectionsByUserId(this.user.id);
        if (this.collections.length && this.selectedCollectionId == null) {
          this.selectedCollectionId = this.collections[0].id;
        }
      } catch (err) {
        const detail = err?.data?.message || err?.message || 'No se pudieron cargar las colecciones.';
        this.$toast?.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
      }
    },
    async saveToCollection() {
      if (this.selectedCollectionId == null) {
        this.$toast?.add({ severity: 'warn', summary: 'Selecciona', detail: 'Elige una colección.', life: 3000 });
        return;
      }
      this.savingToCollection = true;
      try {
        await this.collectionService.addRouteToCollection(this.selectedCollectionId, this.route.id);
        this.$toast?.add({ severity: 'success', summary: 'Guardado', detail: 'Ruta agregada a la colección.', life: 3000 });
        this.showCollectionPicker = false;
      } catch (err) {
        const detail = err?.data?.message || err?.message || 'No se pudo guardar la ruta.';
        this.$toast?.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
      } finally {
        this.savingToCollection = false;
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

      <div v-if="driverId != null && ratingCount > 0" class="driver-rating">
        <StarRating :model-value="ratingAverage" readonly show-count :count="ratingCount" />
        <span class="rating-avg">{{ ratingAverage }}.0 / 5</span>
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
        <div v-if="etaLoading || etaText" class="stat">
          <i class="pi pi-send"></i>
          <span v-if="etaText">ETA {{ etaText }}</span>
          <span v-else>Calculando ETA...</span>
        </div>
      </div>

      <MapWithMarkers
        v-if="mapStops.length"
        :stops="mapStops"
        :polyline="polyline"
        height="320px"
      />

      <div class="stops-list">
        <div v-for="(stop, i) in route.stops" :key="stop.id || i" class="stop-item">
          <i class="pi pi-map-marker"></i>
          <div class="stop-text">
            <span class="stop-name">{{ stop.name }}</span>
            <span class="stop-address">{{ stop.address }}</span>
          </div>
        </div>
      </div>

      <ScheduleDetailsItem v-if="route.schedules?.length" :schedules="route.schedules" />

      <div v-if="isPassenger" class="book-action">
        <div class="action-row">
          <pb-Button
            label="Hacer viaje"
            icon="pi pi-directions"
            :loading="booking"
            @click="bookTrip"
          />
          <pb-Button
            label="Reservar asiento"
            icon="pi pi-ticket"
            severity="secondary"
            @click="openReserve"
          />
          <pb-Button
            label="Guardar en colección"
            icon="pi pi-bookmark"
            severity="secondary"
            outlined
            @click="openCollectionPicker"
          />
        </div>
        <p class="book-hint">
          Origen: <strong>{{ originStop?.name }}</strong> · Destino: <strong>{{ destinationStop?.name }}</strong>
        </p>
      </div>
    </div>

    <pb-Dialog
      v-model:visible="showCollectionPicker"
      modal
      header="Guardar en colección"
      :style="{ width: '24rem' }"
    >
      <div v-if="collections.length" class="picker-body">
        <label class="picker-label">Colección</label>
        <select v-model="selectedCollectionId" class="picker-select">
          <option v-for="c in collections" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <p v-else class="picker-empty">No tienes colecciones. Crea una desde la sección Colecciones.</p>
      <template #footer>
        <pb-Button label="Cancelar" text @click="showCollectionPicker = false" />
        <pb-Button
          label="Guardar"
          icon="pi pi-check"
          :loading="savingToCollection"
          :disabled="!collections.length"
          @click="saveToCollection"
        />
      </template>
    </pb-Dialog>

    <pb-Dialog
      v-model:visible="showReserve"
      modal
      header="Reservar asiento"
      :style="{ width: '24rem' }"
    >
      <div class="picker-body">
        <label class="picker-label">Asientos</label>
        <input v-model.number="reserveSeats" type="number" min="1" class="picker-select" />
        <label class="picker-label">Número de documento (DNI)</label>
        <input v-model="reserveDocument" type="text" class="picker-select" placeholder="Ej. 12345678" />
        <label class="picker-label">Método de pago</label>
        <select v-model="reservePaymentMethod" class="picker-select">
          <option value="Card">Tarjeta</option>
          <option value="Yape">Yape</option>
          <option value="Plin">Plin</option>
          <option value="Cash">Efectivo</option>
        </select>
      </div>
      <template #footer>
        <pb-Button label="Cancelar" text @click="showReserve = false" />
        <pb-Button
          label="Reservar"
          icon="pi pi-check"
          :loading="reserving"
          @click="confirmReserve"
        />
      </template>
    </pb-Dialog>
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
.detail-title .arrow { color: var(--gold-400); }
.detail-stops-count {
  font-size: 0.8rem;
  color: var(--carbon-400);
}
.driver-rating {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rating-avg {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--carbon-300);
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
  color: var(--gold-400);
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
.action-row { display: flex; flex-wrap: wrap; gap: 10px; }
.picker-body { display: flex; flex-direction: column; gap: 6px; }
.picker-label { font-size: 0.8rem; color: var(--carbon-400); }
.picker-select {
  padding: 10px 12px; background: var(--carbon-800); border: 1px solid var(--carbon-700);
  border-radius: 8px; color: var(--carbon-100); font-size: 0.9rem;
}
.picker-select:focus { outline: none; border-color: var(--gold-500); }
.picker-empty { font-size: 0.85rem; color: var(--carbon-400); }
</style>
