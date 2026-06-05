<template>
  <div class="res-page">
    <div class="page-header">
      <h1 class="page-title">Mis <span class="gold">Reservas</span></h1>
      <p class="page-sub">Tus reservas de asientos en viajes</p>
    </div>

    <!-- Cargando: skeleton reutilizable -->
    <div v-if="isLoading" class="res-list">
      <div v-for="i in 4" :key="i" class="res-row sk-card">
        <SkeletonLoader width="40px" height="40px" radius="12px" />
        <div class="sk-stack">
          <SkeletonLoader width="55%" height="14px" />
          <SkeletonLoader width="35%" height="12px" />
        </div>
        <SkeletonLoader width="72px" height="22px" radius="9999px" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state error">
      <i class="pi pi-exclamation-triangle"></i>
      <p>No se pudo cargar tus reservas</p>
      <span>{{ error }}</span>
    </div>

    <!-- Lista de reservas -->
    <div v-else-if="reservations.length > 0" class="res-list">
      <div
        v-for="(r, i) in reservations"
        :key="r.id"
        class="res-row"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <div class="res-icon"><i class="pi pi-ticket"></i></div>

        <div class="res-info">
          <h3>Reserva #{{ r.id }} &middot; Viaje #{{ r.fkIdTrip }}</h3>
          <p class="res-meta-line">
            <i class="pi pi-users"></i>
            {{ r.seats }} {{ r.seats === 1 ? 'asiento' : 'asientos' }}
            <span class="dot">&bull;</span>
            <i class="pi pi-id-card"></i>
            {{ documentTypeLabel(r.documentType) }} {{ r.documentNumber }}
          </p>
          <p class="res-meta-line muted">
            <i class="pi pi-calendar"></i>
            Reservado el {{ formatDateTime(r.reservedAt) }}
            <template v-if="r.confirmedAt">
              <span class="dot">&bull;</span>
              Confirmado el {{ formatDateTime(r.confirmedAt) }}
            </template>
          </p>
        </div>

        <div class="res-actions">
          <span class="status-badge" :class="statusClass(r.status)">
            {{ statusLabel(r.status) }}
          </span>

          <div v-if="r.isPending || r.isCancellable" class="btn-row">
            <pb-Button
              v-if="r.isPending"
              label="Confirmar"
              icon="pi pi-check"
              size="small"
              class="btn-confirm"
              :loading="busyId === r.id"
              :disabled="busyId !== null"
              @click="onConfirm(r)"
            />
            <pb-Button
              v-if="r.isCancellable"
              label="Cancelar"
              icon="pi pi-times"
              size="small"
              severity="danger"
              outlined
              :loading="busyId === r.id"
              :disabled="busyId !== null"
              @click="onCancel(r)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Vacio -->
    <div v-else class="empty-state">
      <i class="pi pi-ticket"></i>
      <p>No tienes reservas registradas</p>
      <span>Reserva un asiento en un viaje y aparecera aqui</span>
    </div>

    <!-- Mensaje de accion (resultado de confirmar/cancelar) -->
    <pb-Message
      v-if="actionMsg"
      :severity="actionMsgSeverity"
      :closable="true"
      class="action-msg"
      @close="actionMsg = ''"
    >
      {{ actionMsg }}
    </pb-Message>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ReservationService } from '@/reservations/services/reservation.service.js'
import { RESERVATION_STATUS, DOCUMENT_TYPE } from '@/reservations/models/reservation.entity.js'
import SkeletonLoader from '@/shared/components/SkeletonLoader.vue'

const reservations = ref([])
const isLoading     = ref(false)
const error         = ref('')
const busyId        = ref(null)
const actionMsg     = ref('')
const actionMsgSeverity = ref('success')

const svc = new ReservationService()

// ── Etiquetas y estilos por status ──
const STATUS_LABELS = {
  [RESERVATION_STATUS.PENDING]:   'Pendiente',
  [RESERVATION_STATUS.CONFIRMED]: 'Confirmada',
  [RESERVATION_STATUS.CANCELLED]: 'Cancelada',
  [RESERVATION_STATUS.COMPLETED]: 'Completada',
  [RESERVATION_STATUS.REFUNDED]:  'Reembolsada'
}
const statusLabel = (s) => STATUS_LABELS[s] || s || 'Desconocido'
const statusClass = (s) => `st-${(s || 'unknown').toLowerCase()}`

const DOC_LABELS = {
  [DOCUMENT_TYPE.DNI]: 'DNI'
}
const documentTypeLabel = (d) => DOC_LABELS[d] || d || ''

// ── Formateadores ──
const formatDateTime = (v) => {
  if (!v) return 'Sin fecha'
  return new Date(v).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// ── Carga ──
const load = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.id) {
      reservations.value = []
      return
    }
    // ReservationService ya devuelve entidades Reservation con los enums
    // (status, documentType) normalizados de int -> string.
    const data = await svc.getByUser(user.id)
    reservations.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = e?.message || 'Error inesperado'
  } finally {
    isLoading.value = false
  }
}

// ── Acciones ──
const onConfirm = async (r) => {
  busyId.value = r.id
  actionMsg.value = ''
  try {
    const updated = await svc.confirm(r.id)
    replaceReservation(updated)
    showMessage('Reserva confirmada correctamente', 'success')
  } catch (e) {
    showMessage(e?.message || 'No se pudo confirmar la reserva', 'error')
  } finally {
    busyId.value = null
  }
}

const onCancel = async (r) => {
  busyId.value = r.id
  actionMsg.value = ''
  try {
    const updated = await svc.cancel(r.id)
    replaceReservation(updated)
    showMessage('Reserva cancelada correctamente', 'warn')
  } catch (e) {
    showMessage(e?.message || 'No se pudo cancelar la reserva', 'error')
  } finally {
    busyId.value = null
  }
}

const replaceReservation = (updated) => {
  // svc.confirm/cancel ya devuelven una entidad Reservation normalizada.
  if (!updated || updated.id == null) return
  const idx = reservations.value.findIndex((x) => x.id === updated.id)
  if (idx !== -1) reservations.value.splice(idx, 1, updated)
}

const showMessage = (msg, severity) => {
  actionMsg.value = msg
  actionMsgSeverity.value = severity
}

onMounted(load)
</script>

<style scoped>
.res-page { padding: 2rem; max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-100); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-600); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

.res-list { display: flex; flex-direction: column; gap: 10px; }
.res-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  animation: fadeUp 0.35s var(--ease-out-expo) both;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.res-icon {
  width: 40px; height: 40px;
  background: var(--gold-100);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-600);
  flex-shrink: 0;
}

.res-info { flex: 1; min-width: 0; }
.res-info h3 { font-size: 0.95rem; font-weight: 600; color: var(--carbon-100); }
.res-meta-line {
  font-size: 0.8rem; color: var(--carbon-400); margin-top: 4px;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.res-meta-line.muted { color: var(--carbon-500); }
.res-meta-line i { font-size: 0.75rem; color: var(--carbon-500); }
.res-meta-line .dot { color: var(--carbon-600); margin: 0 2px; }

.res-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.btn-row { display: flex; gap: 8px; }
.btn-confirm :deep(.p-button),
.btn-confirm { --p-button-primary-background: var(--gold-600); }

/* ── Badge de status (colores semanticos del tema claro) ── */
.status-badge {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
  padding: 4px 10px; border-radius: var(--radius-full);
  border: 1px solid transparent; white-space: nowrap;
}
.st-pending    { color: var(--warning); background: rgba(224,169,46,0.12); border-color: rgba(224,169,46,0.30); }
.st-confirmed  { color: var(--success); background: rgba(59,174,110,0.12); border-color: rgba(59,174,110,0.30); }
.st-completed  { color: var(--gold-600); background: rgba(154,134,201,0.12); border-color: rgba(154,134,201,0.30); }
.st-cancelled  { color: var(--danger);  background: rgba(226,86,107,0.12); border-color: rgba(226,86,107,0.30); }
.st-refunded   { color: var(--carbon-400); background: var(--carbon-800); border-color: var(--carbon-700); }
.st-unknown    { color: var(--carbon-400); background: var(--carbon-800); border-color: var(--carbon-700); }

/* ── Skeleton card (usa SkeletonLoader compartido) ── */
.sk-card { animation: none; }
.sk-stack { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* ── Estados vacio / error ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 4rem 2rem; color: var(--carbon-500); text-align: center;
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-400); }
.empty-state span { font-size: 0.85rem; }
.empty-state.error i { color: var(--danger); }
.empty-state.error p { color: var(--danger); }

.action-msg { margin-top: 0.5rem; }

@media (max-width: 560px) {
  .res-row { flex-direction: column; align-items: stretch; }
  .res-actions { align-items: stretch; }
  .btn-row { justify-content: stretch; }
}
</style>
