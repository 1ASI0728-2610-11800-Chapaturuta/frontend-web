<script>
import routeCard from "./route-card.component.vue";

export default {
  name: "routesList",
  components: { routeCard },
  props: {
    routes:    { type: Array,   required: true },
    isLoading: { type: Boolean, default: false },
    error:     { type: String,  default: null }
  },
  emits: ['updated', 'deleted']
}
</script>

<template>
  <pb-Toast/>

  <div v-if="isLoading" class="skeleton-list">
    <div v-for="i in 3" :key="i" class="sk-row shimmer"></div>
  </div>

  <div v-else-if="error" class="empty-state error-state">
    <i class="pi pi-exclamation-triangle"></i>
    <p>{{ error }}</p>
  </div>

  <div v-else-if="routes.length > 0" class="routes-list">
    <route-card
      v-for="route in routes"
      :key="route.id"
      :route="route"
      @updated="$emit('updated', $event)"
      @deleted="$emit('deleted', $event)"
    />
  </div>

  <div v-else class="empty-state">
    <i class="pi pi-directions"></i>
    <p>No tienes rutas registradas aún</p>
    <span>Crea tu primera ruta usando el botón de arriba</span>
  </div>

  <pb-ConfirmDialog/>
</template>

<style scoped>
.routes-list { display: flex; flex-direction: column; gap: 12px; }

.skeleton-list { display: flex; flex-direction: column; gap: 12px; }
.sk-row { height: 100px; background: var(--carbon-800); border-radius: var(--radius-xl); }
.shimmer {
  background: linear-gradient(90deg, var(--carbon-700) 25%, var(--carbon-600) 50%, var(--carbon-700) 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 4rem 2rem; color: var(--carbon-500); text-align: center;
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-400); }
.empty-state span { font-size: 0.85rem; }
.error-state { color: var(--danger); }
.error-state i { color: var(--danger); opacity: 0.7; }
</style>
