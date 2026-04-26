<script>
import { Route } from "../../models/route.entity.js";
export default {
  name: "route-detail-item",
  props: {
    route: {
      type: Object,
      required: true
    },
    company: {
      type: Object,
      required: true
    }
  },
  methods: {
    /*addToMyRoutes() {
      // Implementation for adding to user's routes
      this.$toast.add({
        severity: 'success',
        summary: 'Route Added',
        detail: 'This route has been added to your routes.',
        life: 3000
      });
    },*/
    formatPrice(price) {
      return `S/${price.toFixed(2)}`;
    },
    formatDuration(minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}hr ${mins > 0 ? mins + 'min' : ''}` : `${mins}min`;
    }
  }
}
</script>

<template>
  <div class="route-detail-container">
    <div class="route-header">
      <div class="route-icon">
      </div>
      <h1 class="route-title">RouteEntity Procedencia a Destino</h1>
      <div class="route-actions">
        <pv-button
            label="Agregar a mis rutas"
            icon="pi pi-plus"
            class="add-route-btn"
            @click="addToMyRoutes"
        />
      </div>
    </div>

    <div class="route-info-container">
      <div class="company-info">
        <h2 class="company-name">{{ company.name }}</h2>
        <p class="company-address">Dirección</p>

        <div class="route-details">
          <div class="detail-item">
            <i class="pi pi-clock"></i>
            <span>{{ formatDuration(route.durationMin) }} de viaje</span>
          </div>
          <div class="detail-item">
            <i class="pi pi-refresh"></i>
            <span>Suele salir cada 10min</span>
          </div>
          <div class="detail-item">
            <i class="pi pi-phone"></i>
            <span>+51 92342322</span>
          </div>
        </div>
      </div>

      <div class="price-container">
        <h2 class="price">{{ formatPrice(route.price) }}</h2>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-detail-container {
  width: 100%;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.route-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
}

.route-icon-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.route-title {
  font-size: 24px;
  font-weight: bold;
  flex-grow: 1;
}

.add-route-btn {
  background-color: #37123C;
  border: none;
}

.route-info-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.company-info {
  flex: 1;
}

.company-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.company-address {
  color: #666;
  margin-bottom: 15px;
}

.route-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: #37123C;
}
</style>