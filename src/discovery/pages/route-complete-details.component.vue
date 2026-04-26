<script>

import RouteDetailItem from '../components/route-details/route-details-item.component.vue';
import ScheduleDetailItem from '../components/route-details/schedule-details-item.component.vue';
import {RouteService} from "@/network/services/route.service.js";
export default {
  name: "route-complete-detail",
  components: {
    RouteDetailItem,
    ScheduleDetailItem
  },
  props: {
    routeId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      route: null,
      stops: [],
      schedules: [],
      companies: [],
      loading: true,
      error: null
    };
  },
  async created() {
    try {
      this.loading = true;
      const routeService = new RouteService();
      const routes = await routeService.getByRouteId(this.routeId);
    } catch (error) {
      console.error('Error fetching route details:', error);
      this.error = 'Failed to load route details.';
    } finally {
      this.loading = false;
    }
  }
};
</script>

<template>
  <div class="route-complete-detail">
    <div v-if="loading" class="loading-state">
      <p>Loading route details...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>
    <div v-else>
      <RouteDetailItem :route="route" :company="companies[0]"/>
      <ScheduleDetailItem :schedules="schedules.flat()"/>-->
    </div>
  </div>
</template>