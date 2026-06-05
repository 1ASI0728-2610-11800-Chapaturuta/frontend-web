<script>
import popUpNewStop from "@/network/components/stop-popUps/new-stop-popup.component.vue";

export default {
  name: "StopsHeaderTitle",
  components: { popUpNewStop },
  emits: ['created'],
  methods: {
    handleStopCreated(newStop) {
      this.$emit('created', newStop)
    }
  }
}
</script>

<template>
  <div class="stops-header">
    <div class="header-main">
      <div>
        <h1 class="page-title">Gestión de <span class="gold">Paraderos</span></h1>
        <p class="page-sub">Administra los puntos de parada de tu servicio</p>
      </div>
      <div class="header-actions">
        <div class="stat-pill">
          <i class="pi pi-map-marker"></i>
          <span>{{ $parent.stops?.length || 0 }} paraderos</span>
        </div>
        <pop-up-new-stop @created="handleStopCreated" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stops-header {
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
.header-actions { display: flex; align-items: center; gap: 12px; }
.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gold-400);
}
</style>
