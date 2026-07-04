<template>
  <div class="reservations-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis <span class="gold">Reservas</span></h1>
        <p class="page-sub">Reservas de asientos realizadas</p>
      </div>
      <button class="refresh-btn" type="button" @click="load">
        <i class="pi pi-refresh"></i> Actualizar
      </button>
    </div>

    <div v-if="loading" class="state-card">Cargando reservas...</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>
    <div v-else-if="reservations.length === 0" class="state-card">
      <i class="pi pi-ticket"></i>
      <span>No tienes reservas registradas.</span>
    </div>

    <div v-else class="reservations-list">
      <article v-for="r in reservations" :key="r.id" class="reservation-row">
        <div class="res-icon"><i class="pi pi-ticket"></i></div>
        <div class="res-info">
          <h3>Reserva #{{ r.id }}</h3>
          <p>Viaje #{{ r.fkIdTrip ?? r.tripId ?? '-' }} · {{ r.seats ?? r.seatCount ?? 1 }} asiento(s)</p>
        </div>
        <div class="res-meta">
          <span class="status-badge" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
          <div class="res-actions">
            <button
              v-if="canPay(r)"
              class="act-btn act-pay"
              :disabled="acting === r.id"
              @click="openPay(r)"
            ><i class="pi pi-wallet"></i> Pagar</button>
            <button
              v-if="canCancel(r.status)"
              class="act-btn act-cancel"
              :disabled="acting === r.id"
              @click="doCancel(r)"
            ><i class="pi pi-times"></i> Cancelar</button>
          </div>
        </div>
      </article>
    </div>

    <PaymentCheckoutDialog
      v-model="showPay"
      title="Pagar reserva"
      :amount="payAmount"
      :payment-id="payPaymentId"
      :method="payMethod"
      success-message="Tu reserva fue pagada y confirmada."
      @paid="onPaid"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { ReservationService } from '@/reservations/services/reservation.service.js'
import { PaymentService } from '@/payments/services/payment.service.js'
import PaymentCheckoutDialog from '@/payments/components/payment-checkout-dialog.component.vue'
import { getUserId } from '@/shared/services/session.service.js'

const svc = new ReservationService()
const paymentSvc = new PaymentService()
const toast = useToast()
const reservations = ref([])
const loading = ref(false)
const error = ref('')
const acting = ref(null)

const showPay = ref(false)
const payPaymentId = ref(null)
const payMethod = ref('')
const payAmount = ref(0)

const canPay = (r) => normalizeStatus(r.status) === 'pending' && !!r.fkIdPayment

async function openPay(reservation) {
  acting.value = reservation.id
  try {
    const payment = await paymentSvc.getPaymentById(reservation.fkIdPayment)
    payPaymentId.value = reservation.fkIdPayment
    payMethod.value = payment?.method || 'Yape'
    payAmount.value = Number(payment?.amount || 0)
    showPay.value = true
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.data?.message || 'No se pudo cargar el pago.', life: 4000 })
  } finally {
    acting.value = null
  }
}

async function onPaid() {
  toast.add({ severity: 'success', summary: 'Reserva pagada', life: 2500 })
  await load()
}

const normalizeStatus = (s) => String(s ?? '').toLowerCase().replace(/[\s_]/g, '')
const statusClass = (s) => ({
  pending: 'st-pending',
  confirmed: 'st-confirmed',
  cancelled: 'st-cancelled',
  canceled: 'st-cancelled'
}[normalizeStatus(s)] || 'st-pending')
const statusLabel = (s) => ({
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  canceled: 'Cancelada'
}[normalizeStatus(s)] || (s || 'Pendiente'))
const canCancel = (s) => ['pending', 'confirmed'].includes(normalizeStatus(s))

async function load() {
  const userId = getUserId()
  if (!userId) {
    error.value = 'No hay usuario autenticado.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    reservations.value = await svc.getByUser(userId)
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'No se pudieron cargar las reservas'
    reservations.value = []
  } finally {
    loading.value = false
  }
}

async function doCancel(reservation) {
  acting.value = reservation.id
  try {
    await svc.cancel(reservation.id)
    toast.add({ severity: 'success', summary: 'Reserva cancelada', life: 3000 })
    await load()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.data?.message || err?.message || 'No se pudo cancelar la reserva', life: 4000 })
  } finally {
    acting.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.reservations-page { padding: 2rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-400); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }
.refresh-btn {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid rgba(139,92,246,0.3); color: var(--gold-400); background: rgba(139,92,246,0.1);
  border-radius: var(--radius-md); padding: 8px 14px; cursor: pointer;
}
.state-card {
  min-height: 180px; background: var(--carbon-800); border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
  gap: 10px; color: var(--carbon-400);
}
.state-card.error { color: var(--danger); border-color: rgba(248,113,113,0.3); }
.reservations-list { display: flex; flex-direction: column; gap: 10px; }
.reservation-row {
  display: flex; align-items: center; gap: 16px; padding: 1rem 1.5rem;
  background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-lg);
}
.res-icon {
  width: 40px; height: 40px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2);
  border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;
  color: var(--gold-500); flex-shrink: 0;
}
.res-info { flex: 1; }
.res-info h3 { font-size: 0.9rem; font-weight: 600; color: var(--carbon-100); }
.res-info p { font-size: 0.8rem; color: var(--carbon-400); margin-top: 2px; }
.res-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.status-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.03em; }
.st-pending   { background: rgba(138,138,138,0.15); color: var(--carbon-300); }
.st-confirmed { background: rgba(74,222,128,0.15);  color: var(--success); }
.st-cancelled { background: rgba(248,113,113,0.15); color: var(--danger); }
.res-actions { display: flex; gap: 6px; }
.act-btn {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 600;
  padding: 4px 10px; border-radius: 6px; cursor: pointer; border: 1px solid transparent;
}
.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.act-cancel { background: rgba(248,113,113,0.12); color: var(--danger); border-color: rgba(248,113,113,0.3); }
.act-pay    { background: rgba(139,92,246,0.14); color: var(--gold-400); border-color: rgba(139,92,246,0.35); }
</style>
