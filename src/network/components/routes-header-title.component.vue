<script setup>
import NewRoutePopupComponent from "@/network/components/routes-popUps/new-route-popup.component.vue";
const emit = defineEmits(["created"])
</script>

<template>
  <div class="routes-header">
    <div class="header-main">
      <div>
        <h1 class="page-title">Gestión de <span class="gold">Rutas</span></h1>
        <p class="page-sub">Administra las rutas de transporte de tu empresa</p>
      </div>
      <new-route-popup-component @created="emit('created')" />
    </div>
  </div>
</template>

<style scoped>
.routes-header {
  padding: 1.75rem 2rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--gold-500);
}
.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.03em;
}
.page-title .gold { color: var(--gold-400); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }
</style>
