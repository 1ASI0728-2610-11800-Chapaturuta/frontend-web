<template>
  <div class="payments-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pagos</h1>
        <p class="page-sub">Consulta pagos asociados a reservas y suscripciones.</p>
      </div>
      <button class="refresh-btn" type="button" @click="load">
        <i class="pi pi-refresh"></i>
        Actualizar
      </button>
    </div>

    <div v-if="loading" class="state-card">Cargando pagos...</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>
    <div v-else-if="payments.length === 0" class="state-card">
      <i class="pi pi-wallet"></i>
      <span>No hay pagos registrados para este usuario.</span>
    </div>

    <div v-else class="payments-grid">
      <article v-for="payment in payments" :key="payment.id" class="payment-card">
        <div class="card-top">
          <div>
            <h3>Pago #{{ payment.id }}</h3>
            <p>{{ payment.referenceType }} {{ payment.referenceId }}</p>
          </div>
          <span class="status" :class="statusClass(payment.status)">{{ payment.status }}</span>
        </div>
        <div class="amount">{{ payment.currency }} {{ formatMoney(payment.amount) }}</div>
        <div class="meta-grid">
          <div><span>Metodo</span><strong>{{ payment.method }}</strong></div>
          <div><span>Creado</span><strong>{{ formatDate(payment.createdAt) }}</strong></div>
          <div><span>Confirmado</span><strong>{{ payment.confirmedAt ? formatDate(payment.confirmedAt) : 'Pendiente' }}</strong></div>
          <div><span>Referencia</span><strong>{{ payment.externalReference || '-' }}</strong></div>
        </div>
        <div class="card-actions">
          <button
            v-if="isPending(payment.status)"
            class="pay-action"
            type="button"
            @click="openPay(payment)"
          >
            <i class="pi pi-credit-card"></i> Pagar con tarjeta
          </button>
          <button
            v-if="isPending(payment.status)"
            class="ghost-action danger"
            type="button"
            :disabled="actingId === payment.id"
            @click="markFailed(payment)"
          >
            <i class="pi pi-times-circle"></i> Marcar fallido
          </button>
          <button
            v-if="isCompleted(payment.status)"
            class="ghost-action"
            type="button"
            :disabled="actingId === payment.id"
            @click="openRefund(payment)"
          >
            <i class="pi pi-replay"></i> Reembolsar
          </button>
          <button
            class="ghost-action"
            type="button"
            :disabled="actingId === payment.id"
            @click="toggleRefunds(payment)"
          >
            <i class="pi pi-list"></i> {{ expandedId === payment.id ? 'Ocultar' : 'Ver' }} reembolsos
          </button>
        </div>

        <div v-if="expandedId === payment.id" class="refunds-box">
          <p v-if="(refundsByPayment[payment.id] || []).length === 0" class="refunds-empty">
            Sin reembolsos para este pago.
          </p>
          <div
            v-for="refund in refundsByPayment[payment.id] || []"
            :key="refund.id"
            class="refund-row"
          >
            <div>
              <strong>Reembolso #{{ refund.id }}</strong>
              <span>{{ payment.currency }} {{ formatMoney(refund.amount) }} · {{ refund.status }}</span>
            </div>
            <button
              v-if="isPending(refund.status)"
              class="ghost-action sm"
              type="button"
              :disabled="actingId === payment.id"
              @click="confirmRefund(payment, refund)"
            >
              Confirmar
            </button>
          </div>
        </div>
      </article>
    </div>

    <pb-Dialog
      v-model:visible="showPay"
      modal
      header="Pago con tarjeta (PayU)"
      :style="{ width: '28rem' }"
    >
      <PayuCardForm
        v-if="selectedPayment"
        :payment-id="selectedPayment.id"
        :amount="selectedPayment.amount"
        @paid="onPaid"
        @error="() => {}"
      />
    </pb-Dialog>

    <pb-Dialog
      v-model:visible="showRefund"
      modal
      header="Solicitar reembolso"
      :style="{ width: '26rem' }"
    >
      <div v-if="selectedPayment" class="refund-form">
        <label class="refund-label">Monto (máx. S/ {{ Number(selectedPayment.amount).toFixed(2) }})</label>
        <input v-model="refundAmount" type="number" min="0" step="0.01" class="refund-input" />
        <label class="refund-label">Motivo</label>
        <input v-model="refundReason" type="text" class="refund-input" placeholder="Motivo del reembolso" />
        <small v-if="refundError" class="refund-error">{{ refundError }}</small>
      </div>
      <template #footer>
        <pb-Button label="Cancelar" text @click="showRefund = false" />
        <pb-Button
          label="Reembolsar"
          icon="pi pi-check"
          :disabled="!!refundError"
          :loading="actingId === selectedPayment?.id"
          @click="submitRefund"
        />
      </template>
    </pb-Dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { PaymentService, RefundService } from '@/payments/services/payment.service.js'
import PayuCardForm from '@/payments/components/payu-card-form.component.vue'
import { required, maxAmount } from '@/shared/validation/validators.js'
import { getUserId } from '@/shared/services/session.service.js'

const service = new PaymentService()
const refundService = new RefundService()
const payments = ref([])
const loading = ref(false)
const error = ref('')
const toast = useToast()

const showPay = ref(false)
const selectedPayment = ref(null)

const actingId = ref(null)
const expandedId = ref(null)
const refundsByPayment = ref({})
const showRefund = ref(false)
const refundAmount = ref(0)
const refundReason = ref('')

const refundError = computed(() => {
  const max = selectedPayment.value?.amount ?? 0
  return maxAmount(refundAmount.value, max, 'El monto') || required(refundReason.value, 'El motivo')
})

function isPending(status) {
  return String(status || '').toLowerCase() === 'pending'
}
function isCompleted(status) {
  return String(status || '').toLowerCase() === 'completed'
}
function openPay(payment) {
  selectedPayment.value = payment
  showPay.value = true
}

async function markFailed(payment) {
  actingId.value = payment.id
  try {
    await service.failPayment(payment.id)
    toast.add({ severity: 'success', summary: 'Pago marcado como fallido', life: 3000 })
    await load()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.data?.message || err?.message || 'No se pudo actualizar el pago', life: 4000 })
  } finally {
    actingId.value = null
  }
}

function openRefund(payment) {
  selectedPayment.value = payment
  refundAmount.value = payment.amount
  refundReason.value = ''
  showRefund.value = true
}

async function submitRefund() {
  const payment = selectedPayment.value
  if (!payment) return
  if (refundError.value) {
    toast.add({ severity: 'warn', summary: 'Revisa el reembolso', detail: refundError.value, life: 3500 })
    return
  }
  actingId.value = payment.id
  try {
    await service.createRefund(payment.id, { amount: refundAmount.value, reason: refundReason.value })
    toast.add({ severity: 'success', summary: 'Reembolso solicitado', life: 3000 })
    showRefund.value = false
    await loadRefunds(payment, true)
    await load()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.friendlyMessage || err?.data?.message || err?.message || 'No se pudo crear el reembolso', life: 4000 })
  } finally {
    actingId.value = null
  }
}

async function loadRefunds(payment, force = false) {
  if (!force && refundsByPayment.value[payment.id]) return
  try {
    refundsByPayment.value = { ...refundsByPayment.value, [payment.id]: await service.getRefunds(payment.id) }
  } catch {
    refundsByPayment.value = { ...refundsByPayment.value, [payment.id]: [] }
  }
}

async function toggleRefunds(payment) {
  if (expandedId.value === payment.id) {
    expandedId.value = null
    return
  }
  await loadRefunds(payment)
  expandedId.value = payment.id
}

async function confirmRefund(payment, refund) {
  actingId.value = payment.id
  try {
    await refundService.confirm(refund.id)
    toast.add({ severity: 'success', summary: 'Reembolso confirmado', life: 3000 })
    await loadRefunds(payment, true)
    await load()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.data?.message || err?.message || 'No se pudo confirmar el reembolso', life: 4000 })
  } finally {
    actingId.value = null
  }
}
async function onPaid() {
  showPay.value = false
  toast.add({ severity: 'success', summary: 'Pago enviado', detail: 'Procesando confirmación de PayU…', life: 3500 })
  await load()
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusClass(status) {
  return String(status || '').toLowerCase()
}

async function load() {
  const userId = getUserId()
  if (!userId) {
    error.value = 'No hay usuario autenticado.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    payments.value = await service.getPaymentsByUserId(userId)
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'No se pudieron cargar los pagos'
    payments.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.payments-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem; max-width: 1040px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.page-title { color: var(--carbon-50); font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--carbon-400); font-size: 0.875rem; margin-top: 4px; }
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(139,92,246,0.3);
  color: var(--gold-400);
  background: rgba(139,92,246,0.1);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  cursor: pointer;
}
.state-card {
  min-height: 180px;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--carbon-400);
}
.state-card.error { color: var(--danger); border-color: rgba(248,113,113,0.3); }
.payments-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.payment-card {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.payment-card:hover { border-color: var(--gold-500); }
.card-top { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.card-top h3 { color: var(--carbon-100); font-size: 1rem; }
.card-top p { color: var(--carbon-400); font-size: 0.8rem; margin-top: 2px; }
.status { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: var(--carbon-700); color: var(--carbon-200); }
.status.completed { background: rgba(74,222,128,0.12); color: var(--success); }
.status.pending { background: rgba(251,191,36,0.12); color: var(--warning); }
.status.failed { background: rgba(248,113,113,0.12); color: var(--danger); }
.amount { color: var(--gold-400); font-size: 1.75rem; font-weight: 700; }
.pay-action {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid rgba(139,92,246,0.4); background: rgba(139,92,246,0.1); color: var(--gold-400);
  border-radius: var(--radius-md); padding: 10px; cursor: pointer; font-weight: 600;
  font-family: var(--font-family);
}
.pay-action:hover { background: rgba(139,92,246,0.2); }
.card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ghost-action {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--carbon-600); background: transparent; color: var(--carbon-200);
  border-radius: var(--radius-md); padding: 8px 12px; cursor: pointer; font-weight: 600;
  font-family: var(--font-family); font-size: 0.8rem;
}
.ghost-action:hover:not(:disabled) { border-color: var(--gold-500); color: var(--gold-400); }
.ghost-action:disabled { opacity: 0.5; cursor: not-allowed; }
.ghost-action.danger { color: var(--danger); border-color: rgba(248,113,113,0.4); }
.ghost-action.sm { padding: 4px 10px; font-size: 0.75rem; }
.refunds-box { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--carbon-700); padding-top: 0.75rem; }
.refunds-empty { color: var(--carbon-500); font-size: 0.8rem; }
.refund-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.refund-row strong { color: var(--carbon-100); font-size: 0.85rem; display: block; }
.refund-row span { color: var(--carbon-400); font-size: 0.78rem; }
.refund-form { display: flex; flex-direction: column; gap: 6px; }
.refund-label { font-size: 0.8rem; color: var(--carbon-400); }
.refund-input {
  padding: 10px 12px; background: var(--carbon-800); border: 1px solid var(--carbon-700);
  border-radius: 8px; color: var(--carbon-100); font-size: 0.9rem;
}
.refund-input:focus { outline: none; border-color: var(--gold-500); }
.refund-error { color: var(--danger); font-size: 0.78rem; margin-top: 4px; }
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; border-top: 1px solid var(--carbon-700); padding-top: 1rem; }
.meta-grid div { display: flex; flex-direction: column; gap: 2px; }
.meta-grid span { color: var(--carbon-500); font-size: 11px; text-transform: uppercase; }
.meta-grid strong { color: var(--carbon-200); font-size: 0.85rem; overflow-wrap: anywhere; }
@media (max-width: 800px) { .payments-grid, .meta-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; } }
</style>
