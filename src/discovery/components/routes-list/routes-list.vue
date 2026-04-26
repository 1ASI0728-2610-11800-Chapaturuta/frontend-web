<script>
import RouteCard from "@/discovery/components/routes-list/route-card.vue";
import { RouteService } from "@/network/services/route.service.js";

export default {
  name: "route-component",
  components: { RouteCard },
  data() {
    return {
      routes: [],
      isLoading: false,
      error: null,
    };
  },
  created() {
    this.fetchRoutes();
  },
  methods: {
    async fetchRoutes() {
      this.isLoading = true;
      this.error = null;
      try {
        const json = JSON.parse(localStorage.getItem('user'));
        const routeService = new RouteService();
        this.routes = await routeService.loadRoutesByCompanyId(json.companyId);
      } catch (err) {
        this.error = "No se encontraron rutas para esta empresa.";
      } finally {
        this.isLoading = false;
      }
    },
    formatPrice(price) {
      return `S/${price.toFixed(2)}`;
    },
    formatDuration(minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}hr ${mins > 0 ? mins + "min" : ""}` : `${mins}min`;
    },
    viewRouteDetails(routeId) {
      this.$router.push({ name: "route-detail", params: { routeId } });
    },
  }
};
</script>

<template>
  <div class="route-list-container">
    <h1>Available Routes</h1>
    <div v-if="isLoading" class="loading">Loading routes...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="container-stops">
      <div
          v-for="route in routes"
          :key="route.id"
          class="route-card"
          @click="viewRouteDetails(route.id)"
      >
        <route-card :route-info="route" />
      </div>
    </div>
  </div>
</template>


<style scoped>
.route-list-container {
  padding: 20px;
}

.loading {
  font-size: 18px;
  color: #666;
}

.error {
  color: red;
}

.container-stops{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;              /* Espacio minimalista entre tarjetas */
  padding: 1rem 0;        /* Separación vertical opcional */
  width: 100%;
  max-width: 1280px;
  margin: 20px auto;
}

</style>