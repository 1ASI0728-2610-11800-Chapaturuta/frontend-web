<template>
  <div class="pay-success-wrap">
    <div class="pay-success-card">
      <!-- Estado: confirmando -->
      <template v-if="state === 'loading'">
        <div class="spinner big"></div>
        <h1>Procesando pago...</h1>
        <p>Estamos confirmando tu pago, espera un momento.</p>
      </template>

      <!-- Estado: exito -->
      <template v-else-if="state === 'success'">
        <div class="check-circle">
          <i class="pi pi-check"></i>
        </div>
        <h1>Pago exitoso!</h1>
        <p>Tu suscripcion Premium fue activada. Ya puedes disfrutar todos los beneficios.</p>

        <div v-if="payment" class="receipt">
          <span class="receipt-title">Comprobante</span>
          <div class="receipt-row"><span>Operacion</span><strong>#{{ payment.id }}</strong></div>
          <div class="receipt-row"><span>Metodo</span><strong>{{ methodLabel }}</strong></div>
          <div class="receipt-row"><span>Monto</span><strong>{{ payment.currency || 'PEN' }} {{ amountLabel }}</strong></div>
          <div class="receipt-row"><span>Estado</span><strong class="ok">{{ payment.status }}</strong></div>
          <div class="receipt-row"><span>Fecha</span><strong>{{ dateLabel }}</strong></div>
        </div>

        <button class="primary-btn" type="button" @click="goHome">Volver a la app</button>
      </template>

      <!-- Estado: error -->
      <template v-else>
        <div class="check-circle error">
          <i class="pi pi-times"></i>
        </div>
        <h1>No se pudo confirmar el pago</h1>
        <p>{{ error }}</p>
        <button class="primary-btn ghost" type="button" @click="goHome">Volver</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PaymentService } from '@/payments/services/payment.service.js'

const route = useRoute()
const router = useRouter()
const service = new PaymentService()

const state = ref('loading') // loading | success | error
const error = ref('')
const payment = ref(null)

const METHOD_LABELS = { Yape: 'Yape', Plin: 'Plin', Card: 'Tarjeta', Cash: 'Efectivo' }
const methodLabel = computed(() => METHOD_LABELS[payment.value?.method] || payment.value?.method || '-')
const amountLabel = computed(() => Number(payment.value?.amount || 0).toFixed(2))
const dateLabel = computed(() => {
  const raw = payment.value?.confirmedAt || payment.value?.createdAt
  if (!raw) return '-'
  try { return new Date(raw).toLocaleString('es-PE') } catch { return raw }
})

function goHome() {
  router.push('/')
}

onMounted(async () => {
  const paymentId = route.query.paymentId
  if (!paymentId) {
    state.value = 'error'
    error.value = 'Falta el identificador del pago.'
    return
  }
  try {
    const confirmed = await service.confirmPayment(paymentId)
    payment.value = confirmed
    state.value = 'success'
  } catch (err) {
    state.value = 'error'
    error.value = err?.data?.message || err?.message || 'Ocurrio un error al confirmar el pago.'
  }
})
</script>

<style scoped>
.pay-success-wrap {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--carbon-950, #0c0d10); padding: 1.5rem;
  font-family: var(--font-family);
}
.pay-success-card {
  width: 100%; max-width: 420px;
  background: var(--carbon-800, #1a1c22);
  border: 1px solid var(--carbon-700, #2a2d35);
  border-radius: var(--radius-lg, 16px);
  padding: 2.25rem 1.75rem; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 0.85rem;
}
.pay-success-card h1 { color: var(--carbon-50, #f4f5f7); font-size: 1.4rem; font-weight: 800; }
.pay-success-card p { color: var(--carbon-400, #9aa0ab); font-size: 0.9rem; line-height: 1.45; }
.check-circle {
  width: 76px; height: 76px; border-radius: 50%;
  background: rgba(74,222,128,0.12); color: var(--success, #4ade80);
  display: flex; align-items: center; justify-content: center;
  font-size: 38px; animation: pop 0.4s ease;
}
.check-circle.error { background: rgba(248,113,113,0.12); color: var(--danger, #f87171); }
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.receipt {
  width: 100%; margin-top: 0.5rem;
  background: var(--carbon-900, #14151a);
  border: 1px solid var(--carbon-700, #2a2d35);
  border-radius: var(--radius-md, 10px); padding: 1rem 1.1rem;
  display: flex; flex-direction: column; gap: 0.55rem;
}
.receipt-title { color: var(--gold-400, #8B5CF6); font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em; }
.receipt-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
.receipt-row span { color: var(--carbon-400, #9aa0ab); }
.receipt-row strong { color: var(--carbon-100, #e3e5e9); }
.receipt-row strong.ok { color: var(--success, #4ade80); }
.primary-btn {
  margin-top: 0.75rem; width: 100%; border: none; cursor: pointer;
  background: var(--gradient-gold, linear-gradient(90deg,#8B5CF6,#e7c977));
  color: var(--carbon-950, #0c0d10); font-weight: 800; font-size: 0.95rem;
  padding: 12px 14px; border-radius: var(--radius-md, 10px); font-family: var(--font-family);
}
.primary-btn.ghost { background: var(--carbon-700, #2a2d35); color: var(--carbon-200, #c7cad1); }
.spinner { width: 16px; height: 16px; border: 2px solid var(--carbon-950); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner.big { width: 44px; height: 44px; border-width: 4px; border-color: var(--gold-400, #8B5CF6); border-top-color: transparent; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
