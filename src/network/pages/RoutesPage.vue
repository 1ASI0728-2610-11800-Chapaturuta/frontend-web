<script setup>
import { onMounted, ref } from "vue"
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast' // Import explícito
import RoutesHeaderTitle from "@/network/components/routes-header-title.component.vue"
import RoutesList from "@/network/components/routes-list.component.vue"
import {RouteService} from "@/network/services/route.service.js";


const toast = useToast()
const routes = ref([])
const isLoading = ref(true)
const error = ref(null)


const loadRoutes = async () => {
  isLoading.value = true
  error.value = null
  try {
    const json = JSON.parse(localStorage.getItem('user'));
    const routeAppService = new RouteService();
    routes.value = await routeAppService.loadRoutesByCompanyId(json.companyId);
  } catch (err) {
    let message = "Error al cargar rutas";
    // Si el error es de Axios (o similar), tendrá error.response
    routes.value = []
    if (err.value) {
      message = "No se encontraron rutas para esta empresa (404).";
    } else if (err.message) {
      if (err.message.includes('404') || err.message.includes('encontrado')) {
        return ;
      }
      message = `Error al cargar rutas: ${err.message}`;
    }

    error.value = message;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.value,
      life: 3000
    });
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRoutes()
})
</script>

<template>
  <Toast />
  <routes-header-title @created="loadRoutes"/>
  <routes-list
      :routes="routes"
      :isLoading="isLoading"
      :error="error"
      @updated="loadRoutes"
      @deleted="loadRoutes"
  />
</template>