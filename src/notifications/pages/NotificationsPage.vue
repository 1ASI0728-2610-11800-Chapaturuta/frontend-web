<template>
  <div class="notif-page">
    <div class="page-header">
      <h1 class="page-title">Tus <span class="gold">Notificaciones</span></h1>
      <p class="page-sub">
        Avisos, alertas y novedades de tu cuenta
        <span v-if="unreadCount > 0" class="unread-pill">{{ unreadCount }} sin leer</span>
      </p>
    </div>

    <!-- Cargando: skeleton reutilizable -->
    <div v-if="isLoading" class="notif-list">
      <div v-for="i in 5" :key="i" class="notif-row sk-card">
        <SkeletonLoader width="40px" height="40px" radius="12px" />
        <div class="sk-stack">
          <SkeletonLoader width="50%" height="14px" />
          <SkeletonLoader width="80%" height="12px" />
        </div>
        <SkeletonLoader width="64px" height="22px" radius="9999px" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state error">
      <i class="pi pi-exclamation-triangle"></i>
      <p>No se pudieron cargar las notificaciones</p>
      <span>{{ error }}</span>
    </div>

    <!-- Lista de notificaciones -->
    <div v-else-if="notifications.length > 0" class="notif-list">
      <div
        v-for="(n, i) in notifications"
        :key="n.id"
        class="notif-row"
        :class="[`type-${n.type.toLowerCase()}`, { unread: !n.isRead }]"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <div class="notif-icon" :class="`type-${n.type.toLowerCase()}`">
          <i class="pi" :class="iconFor(n.type)"></i>
        </div>

        <div class="notif-info">
          <h3>
            {{ n.title || typeLabel(n.type) }}
            <span v-if="!n.isRead" class="dot" aria-label="No leida"></span>
          </h3>
          <p class="notif-message">{{ n.message }}</p>
          <p class="notif-date">
            <i class="pi pi-clock"></i>{{ formatDateTime(n.createdAt) }}
          </p>
        </div>

        <div class="notif-actions">
          <button
            v-if="!n.isRead"
            class="act-btn read"
            :disabled="busyId === n.id"
            title="Marcar como leida"
            @click="onMarkRead(n)"
          >
            <i class="pi pi-check"></i>
          </button>
          <button
            class="act-btn remove"
            :disabled="busyId === n.id"
            title="Eliminar"
            @click="onDelete(n)"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Vacio -->
    <div v-else class="empty-state">
      <i class="pi pi-bell"></i>
      <p>No tienes notificaciones</p>
      <span>Cuando recibas avisos apareceran aqui</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NotificationService } from '@/notifications/services/notification.service.js'
import { Notification, NOTIFICATION_TYPE } from '@/notifications/models/notification.entity.js'
import SkeletonLoader from '@/shared/components/SkeletonLoader.vue'

const notifications = ref([])
const isLoading     = ref(false)
const error         = ref('')
const busyId        = ref(null)
const svc = new NotificationService()

const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length)

// -- Mapas por tipo (icono + etiqueta) --
const TYPE_ICONS = {
  [NOTIFICATION_TYPE.INFO]:    'pi-info-circle',
  [NOTIFICATION_TYPE.WARNING]: 'pi-exclamation-triangle',
  [NOTIFICATION_TYPE.SUCCESS]: 'pi-check-circle',
  [NOTIFICATION_TYPE.ERROR]:   'pi-times-circle'
}
const TYPE_LABELS = {
  [NOTIFICATION_TYPE.INFO]:    'Informacion',
  [NOTIFICATION_TYPE.WARNING]: 'Advertencia',
  [NOTIFICATION_TYPE.SUCCESS]: 'Exito',
  [NOTIFICATION_TYPE.ERROR]:   'Error'
}
const iconFor   = (t) => TYPE_ICONS[t] || 'pi-bell'
const typeLabel = (t) => TYPE_LABELS[t] || 'Aviso'

// -- Formateador de fecha --
const formatDateTime = (v) => {
  if (!v) return 'Sin fecha'
  return new Date(v).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// -- Acciones --
const onMarkRead = async (n) => {
  if (n.isRead) return
  busyId.value = n.id
  try {
    await svc.markAsRead(n.id)
    n.isRead = true
  } catch (e) {
    error.value = e?.message || 'No se pudo marcar como leida'
  } finally {
    busyId.value = null
  }
}

const onDelete = async (n) => {
  busyId.value = n.id
  try {
    await svc.delete(n.id)
    notifications.value = notifications.value.filter((x) => x.id !== n.id)
  } catch (e) {
    error.value = e?.message || 'No se pudo eliminar la notificacion'
  } finally {
    busyId.value = null
  }
}

onMounted(async () => {
  isLoading.value = true
  error.value = ''
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.id) {
      notifications.value = []
      return
    }
    const data = await svc.getByUser(user.id)
    notifications.value = (Array.isArray(data) ? data : []).map((d) => new Notification(d))
  } catch (e) {
    error.value = e?.message || 'Error inesperado'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.notif-page { padding: 2rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-100); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-600); }
.page-sub {
  font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.unread-pill {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
  padding: 3px 10px; border-radius: var(--radius-full);
  color: var(--gold-600); background: var(--gold-100);
  border: 1px solid var(--carbon-700);
}

.notif-list { display: flex; flex-direction: column; gap: 10px; }
.notif-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-left: 3px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  animation: fadeUp 0.35s var(--ease-out-expo) both;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

/* No leidas: fondo sutil + barra lateral del color semantico */
.notif-row.unread { background: var(--gold-100); }
.notif-row.unread.type-info    { border-left-color: var(--info); }
.notif-row.unread.type-warning { border-left-color: var(--warning); }
.notif-row.unread.type-success { border-left-color: var(--success); }
.notif-row.unread.type-error   { border-left-color: var(--danger); }

/* Icono por tipo (color semantico) */
.notif-icon {
  width: 40px; height: 40px;
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 1.05rem;
}
.notif-icon.type-info    { color: var(--info);    background: rgba(76,141,246,0.12);  border-color: rgba(76,141,246,0.30); }
.notif-icon.type-warning { color: var(--warning); background: rgba(224,169,46,0.12);  border-color: rgba(224,169,46,0.30); }
.notif-icon.type-success { color: var(--success); background: rgba(59,174,110,0.12);  border-color: rgba(59,174,110,0.30); }
.notif-icon.type-error   { color: var(--danger);  background: rgba(226,86,107,0.12);  border-color: rgba(226,86,107,0.30); }

.notif-info { flex: 1; min-width: 0; }
.notif-info h3 {
  font-size: 0.95rem; font-weight: 600; color: var(--carbon-100);
  display: flex; align-items: center; gap: 8px;
}
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold-600); flex-shrink: 0; }
.notif-message { font-size: 0.85rem; color: var(--carbon-300); margin-top: 4px; line-height: 1.45; }
.notif-date {
  font-size: 0.75rem; color: var(--carbon-500); margin-top: 6px;
  display: flex; align-items: center; gap: 6px;
}
.notif-date i { font-size: 0.7rem; }

/* Acciones */
.notif-actions { display: flex; gap: 6px; flex-shrink: 0; }
.act-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--carbon-700);
  background: var(--surface);
  cursor: pointer; font-size: 0.85rem;
  transition: all 0.18s var(--ease-out-expo);
}
.act-btn:disabled { opacity: 0.5; cursor: default; }
.act-btn.read { color: var(--success); }
.act-btn.read:not(:disabled):hover    { background: rgba(59,174,110,0.12); border-color: rgba(59,174,110,0.30); }
.act-btn.remove { color: var(--danger); }
.act-btn.remove:not(:disabled):hover  { background: rgba(226,86,107,0.12); border-color: rgba(226,86,107,0.30); }

/* Skeleton card (usa SkeletonLoader compartido) */
.sk-card { animation: none; }
.sk-stack { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* Estados vacio / error */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 4rem 2rem; color: var(--carbon-500); text-align: center;
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-400); }
.empty-state span { font-size: 0.85rem; }
.empty-state.error i { color: var(--danger); }
.empty-state.error p { color: var(--danger); }
</style>
