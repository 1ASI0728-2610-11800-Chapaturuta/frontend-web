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
      </article>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { PaymentService } from '@/payments/services/payment.service.js'
import { getUserId } from '@/shared/services/session.service.js'

const service = new PaymentService()
const payments = ref([])
const loading = ref(false)
const error = ref('')

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
.payments-page { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.page-title { color: var(--carbon-50); font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--carbon-400); font-size: 0.875rem; margin-top: 4px; }
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(201,168,76,0.3);
  color: var(--gold-400);
  background: rgba(201,168,76,0.1);
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
.meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; border-top: 1px solid var(--carbon-700); padding-top: 1rem; }
.meta-grid div { display: flex; flex-direction: column; gap: 2px; }
.meta-grid span { color: var(--carbon-500); font-size: 11px; text-transform: uppercase; }
.meta-grid strong { color: var(--carbon-200); font-size: 0.85rem; overflow-wrap: anywhere; }
@media (max-width: 800px) { .payments-grid, .meta-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; } }
</style>
