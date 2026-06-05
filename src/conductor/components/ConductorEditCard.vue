<script setup>
import { UserCircleIcon } from "@heroicons/vue/24/solid/index.js";
</script>

<template>
  <router-link to="information" class="edit-card-link">
    <div class="edit-card">
      <div class="edit-card-inner">
        <div class="icon-wrap">
          <UserCircleIcon class="card-icon" />
        </div>
        <div class="card-text">
          <h3>Editar perfil de Conductor</h3>
          <p>Mantén actualizados tus datos personales, licencia y vehículo</p>
        </div>
        <i class="pi pi-chevron-right card-chevron"></i>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.edit-card-link { text-decoration: none; display: block; }
.edit-card {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.edit-card:hover {
  border-color: var(--gold-500);
  box-shadow: 0 4px 20px rgba(183,166,224,0.12);
}
.edit-card-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.icon-wrap {
  width: 48px; height: 48px;
  background: rgba(183,166,224,0.1);
  border: 1px solid rgba(183,166,224,0.25);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-icon { width: 22px; height: 22px; color: var(--gold-600); }
.card-text { flex: 1; }
.card-text h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--carbon-100);
  margin-bottom: 4px;
}
.card-text p { color: var(--carbon-400); font-size: 0.85rem; }
.card-chevron { color: var(--carbon-500); font-size: 12px; }
</style>
