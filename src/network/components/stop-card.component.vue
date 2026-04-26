<script>
import DeleteStopPopupComponent from "@/network/components/stop-popUps/delete-stop-popup.component.vue"
import EditStopPopupComponent   from "@/network/components/stop-popUps/edit-stop-popup.component.vue"

export default {
  name: "stopCard",
  components: {
    deleteStopPopUp: DeleteStopPopupComponent,
    editStopPopUp: EditStopPopupComponent
  },
  emits: ['updated', 'deleted'],
  props: ['stop']
}
</script>

<template>
  <div class="stop-card">
    <div class="stop-image">
      <img src="https://picsum.photos/seed/stop/200/140" alt="Paradero" />
    </div>
    <div class="stop-details">
      <div>
        <h3 class="stop-name">{{ stop.name }}</h3>
        <p class="stop-location">{{ stop.location }}</p>
      </div>
      <div class="stop-meta">
        <span class="meta-item">
          <i class="pi pi-map-marker"></i>
          {{ stop.address }}
        </span>
        <span class="meta-item" v-if="stop.reference">
          <i class="pi pi-info-circle"></i>
          {{ stop.reference }}
        </span>
      </div>
    </div>
    <div class="stop-actions">
      <edit-stop-pop-up :stop="stop" @updated="$emit('updated', $event)" />
      <delete-stop-pop-up :stop-id="stop.id" @deleted="$emit('deleted', $event)" />
    </div>
  </div>
</template>

<style scoped>
.stop-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  width: 100%;
  transition: border-color var(--duration-fast) ease;
}
.stop-card:hover { border-color: var(--carbon-600); }

.stop-image {
  width: 100px;
  height: 72px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--carbon-700);
}
.stop-image img { width: 100%; height: 100%; object-fit: cover; }

.stop-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stop-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--carbon-100);
}
.stop-location {
  font-size: 0.8rem;
  color: var(--carbon-400);
  margin-top: 2px;
}
.stop-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--carbon-400);
}
.meta-item i { color: var(--carbon-500); font-size: 11px; }

.stop-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
