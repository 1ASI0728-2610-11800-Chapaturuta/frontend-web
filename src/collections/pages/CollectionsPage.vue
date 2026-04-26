<template>
  <div class="collections-page">
    <div class="page-header">
      <h1 class="page-title">Mis <span class="gold">Colecciones</span></h1>
      <p class="page-sub">Guarda y organiza tus rutas favoritas</p>
    </div>

    <div v-if="isLoading" class="skeleton-list">
      <div v-for="i in 4" :key="i" class="sk-card shimmer"></div>
    </div>

    <div v-else-if="collections.length > 0" class="collections-grid">
      <router-link
        v-for="col in collections"
        :key="col.id"
        :to="`/traveller/collections/${col.id}`"
        class="collection-card"
      >
        <div class="col-icon"><i class="pi pi-bookmark-fill"></i></div>
        <div class="col-info">
          <h3>{{ col.name }}</h3>
          <p>{{ col.routeCount ?? 0 }} rutas guardadas</p>
        </div>
        <i class="pi pi-chevron-right col-arrow"></i>
      </router-link>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-bookmark"></i>
      <p>No tienes colecciones aún</p>
      <span>Guarda rutas desde el mapa para verlas aquí</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CollectionService } from '@/collections/services/collection.service.js'

const collections = ref([])
const isLoading   = ref(false)
const svc = new CollectionService()

onMounted(async () => {
  isLoading.value = true
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.id) collections.value = await svc.getCollectionsByUserId(user.id)
  } catch { /* TODO: endpoint pendiente */ }
  finally { isLoading.value = false }
})
</script>

<style scoped>
.collections-page { padding: 2rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-400); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

.collections-grid { display: flex; flex-direction: column; gap: 12px; }
.collection-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 1.25rem 1.5rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.collection-card:hover {
  border-color: var(--gold-500);
  box-shadow: 0 4px 16px rgba(201,168,76,0.12);
}
.col-icon {
  width: 44px; height: 44px;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.25);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-500);
  font-size: 18px;
  flex-shrink: 0;
}
.col-info { flex: 1; }
.col-info h3 { font-size: 0.95rem; font-weight: 600; color: var(--carbon-100); }
.col-info p { font-size: 0.8rem; color: var(--carbon-400); margin-top: 2px; }
.col-arrow { color: var(--carbon-500); font-size: 12px; }

.skeleton-list { display: flex; flex-direction: column; gap: 12px; }
.sk-card { height: 72px; background: var(--carbon-800); border-radius: var(--radius-lg); }
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
</style>
