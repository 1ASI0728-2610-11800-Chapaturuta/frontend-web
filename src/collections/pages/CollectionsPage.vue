<template>
  <div class="collections-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis <span class="gold">Colecciones</span></h1>
        <p class="page-sub">Guarda y organiza tus rutas favoritas</p>
      </div>
      <button class="new-btn" @click="showCreate = !showCreate">
        <i class="pi pi-plus"></i> Nueva colección
      </button>
    </div>

    <div v-if="showCreate" class="create-form">
      <input
        v-model="newName"
        type="text"
        maxlength="60"
        placeholder="Nombre de la colección (máx. 60)"
        class="create-input"
        @keyup.enter="createCollection"
      />
      <button class="create-confirm" :disabled="creating || !newName.trim()" @click="createCollection">
        <i class="pi pi-check"></i> Crear
      </button>
    </div>

    <div v-if="isLoading" class="skeleton-list">
      <div v-for="i in 4" :key="i" class="sk-card shimmer"></div>
    </div>

    <div v-else-if="collections.length > 0" class="collections-grid">
      <div v-for="col in collections" :key="col.id" class="collection-card">
        <div class="col-head" @click="toggle(col.id)">
          <div class="col-icon"><i class="pi pi-bookmark-fill"></i></div>
          <div class="col-info">
            <h3>{{ col.name }}</h3>
            <p>{{ (routesByCol[col.id]?.length ?? col.itemCount) ?? 0 }} rutas guardadas</p>
          </div>
          <i class="pi col-arrow" :class="expanded === col.id ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
        </div>

        <div v-if="expanded === col.id" class="col-routes">
          <div v-if="loadingRoutes" class="routes-loading">Cargando rutas…</div>
          <template v-else>
            <router-link
              v-for="r in (routesByCol[col.id] || [])"
              :key="r.id"
              class="route-row"
              :to="{ name: 'route-detail', params: { routeId: r.id }, query: { routeData: JSON.stringify(r) } }"
            >
              <i class="pi pi-directions"></i>
              <span class="route-name">{{ routeLabel(r) }}</span>
              <span v-if="r.price != null" class="route-price">S/ {{ r.price }}</span>
              <span class="route-stops">{{ r.stops?.length || 0 }} <i class="pi pi-map-marker"></i></span>
              <button class="route-remove" title="Quitar" @click.prevent.stop="removeRoute(col.id, r.id)">
                <i class="pi pi-trash"></i>
              </button>
            </router-link>
            <p v-if="!(routesByCol[col.id] || []).length" class="routes-empty">Sin rutas en esta colección</p>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-bookmark"></i>
      <p>No tienes colecciones aún</p>
      <span>Crea una colección y guarda rutas desde el detalle de cada ruta</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { CollectionService } from '@/collections/services/collection.service.js'
import { RouteService } from '@/network/services/route.service.js'

const collections = ref([])
const routesByCol = ref({})
const isLoading   = ref(false)
const loadingRoutes = ref(false)
const expanded    = ref(null)
const showCreate  = ref(false)
const newName     = ref('')
const creating    = ref(false)
const svc = new CollectionService()
const routeSvc = new RouteService()
const toast = useToast()

const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
}

// Mismo criterio de etiqueta que route-alpha-card: Origen → Destino, con fallback.
const routeLabel = (r) => {
  const stops = r.stops || []
  const origin = stops[0]?.name
  const dest = stops[stops.length - 1]?.name
  return origin && dest ? `${origin} → ${dest}` : (r.name || r.routeName || `Ruta #${r.id}`)
}

const loadCollections = async () => {
  isLoading.value = true
  try {
    const user = currentUser()
    if (user.id) collections.value = await svc.getCollectionsByUserId(user.id)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.friendlyMessage || e?.data?.message || 'No se pudieron cargar las colecciones.', life: 4000 })
  } finally {
    isLoading.value = false
  }
}

const toggle = async (collectionId) => {
  if (expanded.value === collectionId) { expanded.value = null; return }
  expanded.value = collectionId
  if (routesByCol.value[collectionId]) return
  loadingRoutes.value = true
  try {
    // El endpoint solo devuelve referencias (fkIdRoute); enriquecemos con la ruta completa
    // (stops/price) para mostrarla y poder navegar al detalle, que necesita esos datos.
    const items = await svc.getCollectionRoutes(collectionId)
    const routes = await Promise.all(
      items.map(it => routeSvc.getByRouteId(it.fkIdRoute).catch(() => null))
    )
    routesByCol.value = { ...routesByCol.value, [collectionId]: routes.filter(Boolean) }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.friendlyMessage || e?.data?.message || 'No se pudieron cargar las rutas.', life: 4000 })
  } finally {
    loadingRoutes.value = false
  }
}

const createCollection = async () => {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  try {
    const user = currentUser()
    await svc.createCollection({ name, fkIdUser: user.id })
    newName.value = ''
    showCreate.value = false
    toast.add({ severity: 'success', summary: 'Colección creada', detail: name, life: 3000 })
    await loadCollections()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.friendlyMessage || e?.data?.message || 'No se pudo crear la colección.', life: 4000 })
  } finally {
    creating.value = false
  }
}

const removeRoute = async (collectionId, routeId) => {
  try {
    await svc.removeRouteFromCollection(collectionId, routeId)
    routesByCol.value = {
      ...routesByCol.value,
      [collectionId]: (routesByCol.value[collectionId] || []).filter(r => r.id !== routeId)
    }
    toast.add({ severity: 'success', summary: 'Ruta eliminada', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.friendlyMessage || e?.data?.message || 'No se pudo quitar la ruta.', life: 4000 })
  }
}

onMounted(loadCollections)
</script>

<style scoped>
.collections-page { padding: 2rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-400); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }
.new-btn {
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); color: var(--gold-400);
  padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
}
.new-btn:hover { background: rgba(139,92,246,0.2); }

.create-form { display: flex; gap: 8px; }
.create-input {
  flex: 1; padding: 10px 14px; background: var(--carbon-800); border: 1px solid var(--carbon-700);
  border-radius: 8px; color: var(--carbon-100); font-size: 0.9rem;
}
.create-input:focus { outline: none; border-color: var(--gold-500); }
.create-confirm {
  background: var(--gold-500); color: var(--carbon-900); border: none; padding: 0 16px;
  border-radius: 8px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;
}
.create-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.collections-grid { display: flex; flex-direction: column; gap: 12px; }
.collection-card {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.collection-card:hover { border-color: var(--gold-500); box-shadow: 0 4px 16px rgba(139,92,246,0.12); }
.col-head { display: flex; align-items: center; gap: 16px; padding: 1.25rem 1.5rem; cursor: pointer; }
.col-icon {
  width: 44px; height: 44px;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-500); font-size: 18px; flex-shrink: 0;
}
.col-info { flex: 1; }
.col-info h3 { font-size: 0.95rem; font-weight: 600; color: var(--carbon-100); }
.col-info p { font-size: 0.8rem; color: var(--carbon-400); margin-top: 2px; }
.col-arrow { color: var(--carbon-500); font-size: 12px; }

.col-routes { border-top: 1px solid var(--carbon-700); padding: 0.5rem 1.5rem 1rem; display: flex; flex-direction: column; gap: 6px; }
.routes-loading, .routes-empty { font-size: 0.8rem; color: var(--carbon-500); padding: 8px 0; }
.route-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 6px;
  text-decoration: none; border-radius: 8px;
  transition: background var(--duration-fast) ease;
}
.route-row:hover { background: rgba(139,92,246,0.08); }
.route-row i.pi-directions { color: var(--gold-500); }
.route-name { flex: 1; font-size: 0.85rem; color: var(--carbon-200); }
.route-price { font-size: 0.8rem; font-weight: 600; color: var(--gold-400); }
.route-stops {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 0.75rem; color: var(--carbon-400);
}
.route-remove {
  background: none; border: none; color: var(--carbon-500); cursor: pointer; padding: 4px;
}
.route-remove:hover { color: #e57373; }

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
