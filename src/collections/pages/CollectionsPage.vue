<template>
  <div class="collections-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis <span class="accent">Colecciones</span></h1>
        <p class="page-sub">Guarda y organiza tus rutas favoritas</p>
      </div>
      <button class="btn-primary" type="button" @click="openCreate" :disabled="!userId">
        <i class="pi pi-plus"></i>
        <span>Nueva colección</span>
      </button>
    </div>

    <!-- Banner de error -->
    <div v-if="errorMsg" class="banner banner-error">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ errorMsg }}</span>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="collections-grid">
      <div v-for="i in 4" :key="i" class="collection-card sk-card">
        <SkeletonLoader width="44px" height="44px" radius="10px" />
        <div class="sk-lines">
          <SkeletonLoader width="60%" height="14px" />
          <SkeletonLoader width="35%" height="11px" />
        </div>
      </div>
    </div>

    <!-- Lista de colecciones -->
    <div v-else-if="collections.length > 0" class="collections-grid">
      <div v-for="col in collections" :key="col.id" class="collection-card-wrap">
        <div class="collection-card" :class="{ open: expandedId === col.id }">
          <button class="card-main" type="button" @click="toggleExpand(col)">
            <div class="col-icon"><i class="pi pi-bookmark-fill"></i></div>
            <div class="col-info">
              <h3>{{ col.name }}</h3>
              <p>{{ col.itemCount ?? 0 }} {{ (col.itemCount ?? 0) === 1 ? 'ruta guardada' : 'rutas guardadas' }}</p>
            </div>
            <i
              class="pi col-arrow"
              :class="expandedId === col.id ? 'pi-chevron-down' : 'pi-chevron-right'"
            ></i>
          </button>
          <div class="card-actions">
            <button class="icon-btn" type="button" title="Renombrar" @click.stop="openRename(col)">
              <i class="pi pi-pencil"></i>
            </button>
            <button class="icon-btn danger" type="button" title="Eliminar" @click.stop="confirmDelete(col)">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>

        <!-- Panel de rutas (expandible) -->
        <transition name="expand">
          <div v-if="expandedId === col.id" class="routes-panel">
            <div v-if="routesLoading" class="routes-loading">
              <SkeletonLoader v-for="i in 2" :key="i" width="100%" height="48px" radius="8px" />
            </div>

            <ul v-else-if="(routeItems[col.id] || []).length > 0" class="routes-list">
              <li v-for="item in routeItems[col.id]" :key="item.id" class="route-item">
                <div class="route-item-icon"><i class="pi pi-map-marker"></i></div>
                <div class="route-item-info">
                  <span class="route-item-title">Ruta #{{ item.fkIdRoute }}</span>
                  <span class="route-item-sub">Agregada {{ formatDate(item.addedAt) }}</span>
                </div>
                <button
                  class="icon-btn danger sm"
                  type="button"
                  title="Quitar ruta"
                  @click="removeRoute(col, item)"
                >
                  <i class="pi pi-times"></i>
                </button>
              </li>
            </ul>

            <div v-else class="routes-empty">
              <i class="pi pi-inbox"></i>
              <span>Esta colección no tiene rutas todavía</span>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <i class="pi pi-bookmark"></i>
      <p>No tienes colecciones aún</p>
      <span>Crea una colección para empezar a guardar tus rutas favoritas</span>
      <button class="btn-primary" type="button" @click="openCreate" :disabled="!userId">
        <i class="pi pi-plus"></i><span>Nueva colección</span>
      </button>
    </div>

    <!-- Modal crear / renombrar -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-card">
        <h2 class="modal-title">{{ editingId ? 'Renombrar colección' : 'Nueva colección' }}</h2>
        <input
          ref="nameInput"
          v-model.trim="formName"
          class="modal-input"
          type="text"
          placeholder="Nombre de la colección"
          maxlength="60"
          @keyup.enter="submitForm"
        />
        <div class="modal-actions">
          <button class="btn-ghost" type="button" @click="closeForm">Cancelar</button>
          <button class="btn-primary" type="button" :disabled="!formName || saving" @click="submitForm">
            {{ saving ? 'Guardando…' : (editingId ? 'Guardar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal confirmar eliminación -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal-card">
        <h2 class="modal-title">Eliminar colección</h2>
        <p class="modal-text">
          ¿Seguro que deseas eliminar <strong>{{ deleteTarget.name }}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div class="modal-actions">
          <button class="btn-ghost" type="button" @click="deleteTarget = null">Cancelar</button>
          <button class="btn-danger" type="button" :disabled="saving" @click="doDelete">
            {{ saving ? 'Eliminando…' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { CollectionService } from '@/collections/services/collection.service.js'
import SkeletonLoader from '@/shared/components/SkeletonLoader.vue'

const svc = new CollectionService()

const collections   = ref([])
const isLoading     = ref(false)
const errorMsg      = ref('')
const userId        = ref(null)

// Panel de rutas
const expandedId    = ref(null)
const routeItems    = ref({})       // { [collectionId]: CollectionItem[] }
const routesLoading = ref(false)

// Formulario crear/renombrar
const showForm  = ref(false)
const editingId = ref(null)
const formName  = ref('')
const nameInput = ref(null)
const saving    = ref(false)

// Eliminación
const deleteTarget = ref(null)

onMounted(async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    userId.value = user?.id ?? null
  } catch {
    userId.value = null
  }
  await loadCollections()
})

async function loadCollections() {
  if (!userId.value) {
    errorMsg.value = 'No se encontró un usuario activo. Inicia sesión para ver tus colecciones.'
    return
  }
  isLoading.value = true
  errorMsg.value = ''
  try {
    collections.value = await svc.getByUser(userId.value)
  } catch (e) {
    errorMsg.value = 'No pudimos cargar tus colecciones. Intenta de nuevo más tarde.'
    collections.value = []
  } finally {
    isLoading.value = false
  }
}

async function toggleExpand(col) {
  if (expandedId.value === col.id) {
    expandedId.value = null
    return
  }
  expandedId.value = col.id
  if (!routeItems.value[col.id]) {
    routesLoading.value = true
    try {
      routeItems.value = { ...routeItems.value, [col.id]: await svc.getRoutes(col.id) }
    } catch {
      routeItems.value = { ...routeItems.value, [col.id]: [] }
      errorMsg.value = 'No pudimos cargar las rutas de esta colección.'
    } finally {
      routesLoading.value = false
    }
  }
}

function openCreate() {
  editingId.value = null
  formName.value = ''
  showForm.value = true
  focusInput()
}

function openRename(col) {
  editingId.value = col.id
  formName.value = col.name
  showForm.value = true
  focusInput()
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  formName.value = ''
}

async function focusInput() {
  await nextTick()
  nameInput.value?.focus()
}

async function submitForm() {
  if (!formName.value || saving.value) return
  saving.value = true
  errorMsg.value = ''
  try {
    if (editingId.value) {
      const updated = await svc.update(editingId.value, { name: formName.value })
      const idx = collections.value.findIndex(c => c.id === editingId.value)
      if (idx !== -1) {
        collections.value[idx] = { ...collections.value[idx], ...updated, name: updated?.name ?? formName.value }
      }
    } else {
      const created = await svc.create({ name: formName.value, userId: userId.value })
      if (created?.id) {
        collections.value = [...collections.value, created]
      } else {
        // Si el backend no devuelve el cuerpo, recargamos.
        await loadCollections()
      }
    }
    closeForm()
  } catch {
    errorMsg.value = editingId.value
      ? 'No pudimos renombrar la colección.'
      : 'No pudimos crear la colección.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(col) {
  deleteTarget.value = col
}

async function doDelete() {
  if (!deleteTarget.value || saving.value) return
  saving.value = true
  errorMsg.value = ''
  const id = deleteTarget.value.id
  try {
    await svc.delete(id)
    collections.value = collections.value.filter(c => c.id !== id)
    if (expandedId.value === id) expandedId.value = null
    deleteTarget.value = null
  } catch {
    errorMsg.value = 'No pudimos eliminar la colección.'
  } finally {
    saving.value = false
  }
}

async function removeRoute(col, item) {
  errorMsg.value = ''
  try {
    await svc.removeRoute(col.id, item.fkIdRoute)
    routeItems.value = {
      ...routeItems.value,
      [col.id]: (routeItems.value[col.id] || []).filter(i => i.id !== item.id),
    }
    // Actualizamos el contador local.
    const idx = collections.value.findIndex(c => c.id === col.id)
    if (idx !== -1) {
      const current = collections.value[idx].itemCount ?? 0
      collections.value[idx] = { ...collections.value[idx], itemCount: Math.max(0, current - 1) }
    }
  } catch {
    errorMsg.value = 'No pudimos quitar la ruta de la colección.'
  }
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}
</script>

<style scoped>
.collections-page {
  padding: 2rem;
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: var(--ink);
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-100); letter-spacing: -0.02em; }
.page-title .accent { color: var(--gold-600); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

/* Botones */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0.6rem 1.1rem;
  background: var(--gold-600);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 10px);
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer;
  transition: filter var(--duration-fast, 150ms) ease, transform var(--duration-fast, 150ms) ease;
}
.btn-primary:hover:not(:disabled) { filter: brightness(0.95); }
.btn-primary:active:not(:disabled) { transform: translateY(1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-ghost {
  padding: 0.6rem 1.1rem;
  background: transparent;
  color: var(--carbon-300);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md, 10px);
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-fast, 150ms) ease;
}
.btn-ghost:hover { background: var(--carbon-800); }

.btn-danger {
  padding: 0.6rem 1.1rem;
  background: #e05260;
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 10px);
  font-size: 0.875rem; font-weight: 600;
  cursor: pointer;
}
.btn-danger:hover:not(:disabled) { filter: brightness(0.95); }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* Banner */
.banner {
  display: flex; align-items: center; gap: 10px;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md, 10px);
  font-size: 0.85rem;
}
.banner-error {
  background: rgba(224,82,96,0.08);
  border: 1px solid rgba(224,82,96,0.25);
  color: #c23b48;
}

/* Grid de colecciones */
.collections-grid { display: flex; flex-direction: column; gap: 12px; }
.collection-card-wrap { display: flex; flex-direction: column; }

.collection-card {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg, 14px);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: border-color var(--duration-fast, 150ms) ease, box-shadow var(--duration-fast, 150ms) ease;
}
.collection-card:hover { border-color: var(--gold-500); }
.collection-card.open { border-color: var(--gold-500); border-bottom-left-radius: 0; border-bottom-right-radius: 0; }

.card-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 1.1rem 1.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}
.col-icon {
  width: 44px; height: 44px;
  background: var(--lilac-100);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md, 10px);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-600);
  font-size: 18px;
  flex-shrink: 0;
}
.col-info { flex: 1; min-width: 0; }
.col-info h3 {
  font-size: 0.95rem; font-weight: 600; color: var(--carbon-100);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.col-info p { font-size: 0.8rem; color: var(--carbon-400); margin-top: 2px; }
.col-arrow { color: var(--carbon-500); font-size: 12px; }

.card-actions {
  display: flex; align-items: center; gap: 4px;
  padding: 0 0.75rem;
  border-left: 1px solid var(--carbon-700);
}
.icon-btn {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md, 10px);
  color: var(--carbon-400);
  cursor: pointer;
  font-size: 14px;
  transition: background var(--duration-fast, 150ms) ease, color var(--duration-fast, 150ms) ease;
}
.icon-btn:hover { background: var(--carbon-800); color: var(--gold-600); }
.icon-btn.danger:hover { background: rgba(224,82,96,0.1); color: #e05260; }
.icon-btn.sm { width: 28px; height: 28px; font-size: 12px; }

/* Panel de rutas */
.routes-panel {
  background: var(--carbon-800);
  border: 1px solid var(--gold-500);
  border-top: none;
  border-bottom-left-radius: var(--radius-lg, 14px);
  border-bottom-right-radius: var(--radius-lg, 14px);
  padding: 0.85rem 1rem;
}
.routes-loading { display: flex; flex-direction: column; gap: 8px; }
.routes-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.route-item {
  display: flex; align-items: center; gap: 12px;
  padding: 0.6rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md, 10px);
}
.route-item-icon {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--lilac-100);
  border-radius: 8px;
  color: var(--lilac-600);
  font-size: 14px;
}
.route-item-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.route-item-title { font-size: 0.875rem; font-weight: 600; color: var(--carbon-200); }
.route-item-sub { font-size: 0.75rem; color: var(--carbon-400); }

.routes-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 1.5rem; color: var(--carbon-500); text-align: center;
}
.routes-empty i { font-size: 1.5rem; color: var(--carbon-600); }
.routes-empty span { font-size: 0.85rem; }

/* Skeleton card */
.sk-card { padding: 1.1rem 1.25rem; gap: 16px; align-items: center; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 3.5rem 2rem; color: var(--carbon-500); text-align: center;
  background: var(--surface);
  border: 1px dashed var(--carbon-700);
  border-radius: var(--radius-lg, 14px);
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-300); }
.empty-state span { font-size: 0.85rem; max-width: 320px; }
.empty-state .btn-primary { margin-top: 8px; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(31,27,46,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-card {
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg, 14px);
  box-shadow: var(--shadow-card);
  padding: 1.5rem;
  width: 100%; max-width: 380px;
  display: flex; flex-direction: column; gap: 1rem;
}
.modal-title { font-size: 1.1rem; font-weight: 700; color: var(--carbon-100); }
.modal-text { font-size: 0.9rem; color: var(--carbon-400); line-height: 1.5; }
.modal-text strong { color: var(--carbon-200); }
.modal-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md, 10px);
  font-size: 0.9rem;
  color: var(--ink);
  outline: none;
  transition: border-color var(--duration-fast, 150ms) ease;
}
.modal-input:focus { border-color: var(--gold-500); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* Transición panel */
.expand-enter-active, .expand-leave-active { transition: opacity 0.18s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; }
</style>
