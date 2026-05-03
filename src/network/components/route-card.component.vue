<script>
import DeleteRoutePopUp from "@/network/components/routes-popUps/delete-route-popup.component.vue";
import RouteMapDialog from "@/network/components/route-map-dialog.component.vue";

export default {
  name: 'RutaCard',
  props: { route: { type: Object, required: true } },
  components: { DeleteRoutePopUp, RouteMapDialog },
  emits: ['updated', 'deleted'],
  data() { return { mapOpen: false } }
}
</script>

<template>
  <div class="route-card">
    <div class="route-images">
      <div class="route-thumb">
        <img :src="route.stops[0]?.image_url || 'https://picsum.photos/seed/orig/100/100'" alt="Origen" />
        <span class="thumb-label">Origen</span>
      </div>
      <div class="route-arrow">
        <i class="pi pi-arrows-h"></i>
      </div>
      <div class="route-thumb">
        <img :src="route.stops[1]?.image_url || 'https://picsum.photos/seed/dest/100/100'" alt="Destino" />
        <span class="thumb-label">Destino</span>
      </div>
    </div>

    <div class="route-info">
      <div class="route-stops">
        <div class="stop-point">
          <span class="stop-dot origin"></span>
          <div>
            <p class="stop-name">{{ route.stops[0]?.name }}</p>
            <p class="stop-address">{{ route.stops[0]?.address }}</p>
          </div>
        </div>
        <div class="stop-line"></div>
        <div class="stop-point">
          <span class="stop-dot dest"></span>
          <div>
            <p class="stop-name">{{ route.stops[1]?.name }}</p>
            <p class="stop-address">{{ route.stops[1]?.address }}</p>
          </div>
        </div>
      </div>

      <div class="route-stats">
        <div class="stat">
          <i class="pi pi-clock"></i>
          <div>
            <span class="stat-label">Duración</span>
            <span class="stat-val">{{ route.duration }} min</span>
          </div>
        </div>
        <div class="stat">
          <i class="pi pi-car"></i>
          <div>
            <span class="stat-label">Frecuencia</span>
            <span class="stat-val">{{ route.frequency }} min</span>
          </div>
        </div>
        <div class="stat">
          <i class="pi pi-dollar"></i>
          <div>
            <span class="stat-label">Tarifa</span>
            <span class="stat-val">S/ {{ route.price }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="route-actions">
      <pb-Button label="Ver mapa" icon="pi pi-map" class="map-btn" severity="secondary" @click="mapOpen = true" />
      <delete-route-pop-up
        :route-id="route.id"
        @deleted="$emit('deleted', $event)"
        label="Eliminar"
        icon="pi pi-trash"
      />
    </div>
    <route-map-dialog v-model="mapOpen" :route="route" />
  </div>
</template>

<style scoped>
.route-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  width: 100%;
  transition: border-color var(--duration-fast) ease;
}
.route-card:hover { border-color: var(--carbon-600); }

.route-images {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.route-thumb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.route-thumb img {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--carbon-600);
}
.thumb-label { font-size: 10px; color: var(--carbon-500); font-weight: 500; }
.route-arrow { color: var(--carbon-500); font-size: 1.25rem; }

.route-info { flex: 1; display: flex; flex-direction: column; gap: 1rem; }

.route-stops { display: flex; flex-direction: column; gap: 4px; }
.stop-point { display: flex; align-items: flex-start; gap: 10px; }
.stop-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
.stop-dot.origin { background: var(--gold-500); }
.stop-dot.dest   { background: var(--carbon-400); }
.stop-line {
  width: 2px;
  height: 16px;
  background: var(--carbon-700);
  margin-left: 3px;
}
.stop-name { font-size: 0.9rem; font-weight: 700; color: var(--carbon-100); }
.stop-address { font-size: 0.78rem; color: var(--carbon-400); margin-top: 1px; }

.route-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--carbon-900);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  flex: 1;
  min-width: 90px;
}
.stat i { color: var(--gold-500); font-size: 14px; }
.stat-label { display: block; font-size: 10px; color: var(--carbon-500); }
.stat-val { display: block; font-size: 0.9rem; font-weight: 700; color: var(--carbon-100); }

.route-actions { flex-shrink: 0; }
</style>
