<script>
import StopsHeaderTitle from "@/network/components/stops-header-title.component.vue";
import stopsList from "@/network/components/stops-list.component.vue";
import { StopService } from "@/network/services/stop.service.js";
import {ref} from "vue";

export default {
  components: {
    StopsHeaderTitle,
    stopsList,
  },
  data() {
    return {
      stops: [],
      isLoading: false,
      error: null
    };
  },

  methods: {
    async loadStops() {
      this.isLoading = true;
      this.error = null;
      try {
        const service = new StopService();
        //companId from localStorage
        const companyId = JSON.parse(localStorage.getItem("user")).companyId;
        // Get stops by companyId
        this.stops = await service.getStopsByCompanyId(companyId);
      } catch (err) {
        this.error = `Error al cargar paraderos: ${err.message}`;
        // Mostrar toast
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: this.error
        });
      } finally {
        this.isLoading = false;
      }
    },

    async handleUpdated() {
      await this.loadStops();
    },
    async handleDeleted() {
      await this.loadStops();
    },

    async handleCreated() {
      await this.loadStops();
    }
  },
  mounted() {
    this.loadStops();
  }
}
</script>

<template>
  <stops-header-title @created="handleCreated"/>
  <stops-list :stops="stops" :isLoading="isLoading" :error="error" @updated="handleUpdated" @deleted="handleDeleted"/>
</template>