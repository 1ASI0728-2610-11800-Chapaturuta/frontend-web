<template>
  <pb-Dialog
    :visible="modelValue"
    modal
    :header="header"
    :style="{ width: '30rem' }"
    :closable="step !== 'processing'"
    @update:visible="onVisible"
  >
    <!-- Paso 1: elegir metodo -->
    <div v-if="step === 'method'" class="method-step">
      <p class="method-intro">Elige como quieres pagar.</p>
      <div class="amount-pill">Total: <strong>S/ {{ amountLabel }}</strong></div>
      <button
        v-for="m in methods"
        :key="m"
        class="method-card"
        type="button"
        @click="chooseMethod(m)"
      >
        <i :class="methodIcon(m)"></i>
        <div><strong>{{ methodLabel(m) }}</strong><span>{{ methodHint(m) }}</span></div>
        <i class="pi pi-chevron-right go"></i>
      </button>
      <p v-if="error" class="checkout-error">{{ error }}</p>
    </div>

    <!-- Paso intermedio: creando el pago -->
    <div v-else-if="step === 'processing'" class="processing-step">
      <span class="spinner big"></span>
      <p>Preparando tu pago...</p>
    </div>

    <!-- Paso 2a: tarjeta (PayU) -->
    <div v-else-if="step === 'card'">
      <div class="sandbox-hint">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>Tarjeta de prueba (sandbox PayU)</strong>
          <span>Nro: 4111 1111 1111 1111 · Venc: 12/29 · CVV: 123 · cualquier email/DNI</span>
          <span>Titular = <strong>APPROVED</strong> para aprobar. El sandbox decide por el nombre (REJECTED → declinada, PENDING, ERROR).</span>
        </div>
      </div>
      <PayuCardForm
        :payment-id="resolvedPaymentId"
        :amount="amount"
        @paid="onPaid"
        @error="(e) => error = e"
      />
    </div>

    <!-- Paso 2b: Yape / Plin (QR) -->
    <div v-else-if="step === 'qr'">
      <PaymentQr
        :payment-id="resolvedPaymentId"
        :amount="amount"
        :method="activeMethod"
        :recipient="recipient"
        @paid="onPaid"
        @error="(e) => error = e"
      />
    </div>

    <!-- Paso 3: exito -->
    <div v-else-if="step === 'success'" class="success-step">
      <div class="check-circle"><i class="pi pi-check"></i></div>
      <h3>Pago exitoso!</h3>
      <p>{{ successMessage }}</p>
      <button class="primary-btn" type="button" @click="close">Listo</button>
    </div>
  </pb-Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PayuCardForm from '@/payments/components/payu-card-form.component.vue'
import PaymentQr from '@/payments/components/payment-qr.component.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  amount: { type: [Number, String], default: 0 },
  title: { type: String, default: 'Pago' },
  recipient: { type: String, default: '' },
  successMessage: { type: String, default: 'Tu pago fue confirmado.' },
  methods: { type: Array, default: () => ['Card', 'Yape', 'Plin'] },
  // Repago de un pago existente: salta el paso de metodo.
  paymentId: { type: [Number, String], default: null },
  method: { type: String, default: '' },
  // Crea el pago bajo demanda: async (method) => paymentId
  payProvider: { type: Function, default: null }
})
const emit = defineEmits(['update:modelValue', 'paid'])

const step = ref('method')
const error = ref('')
const activeMethod = ref('')
const createdPaymentId = ref(null)

const resolvedPaymentId = computed(() => createdPaymentId.value ?? props.paymentId)
const amountLabel = computed(() => Number(props.amount || 0).toFixed(2))
const header = computed(() => {
  if (step.value === 'success') return 'Pago confirmado'
  if (step.value === 'card') return 'Pago con tarjeta (PayU)'
  if (step.value === 'qr') return `Pago con ${methodLabel(activeMethod.value)}`
  return props.title
})

const METHOD_LABELS = { Card: 'Tarjeta', Yape: 'Yape', Plin: 'Plin' }
const methodLabel = (m) => METHOD_LABELS[m] || m
const methodIcon = (m) => (m === 'Card' ? 'pi pi-credit-card' : 'pi pi-qrcode')
const methodHint = (m) => (m === 'Card' ? 'Credito o debito vía PayU' : 'Escanea un QR con tu app')

function stepForMethod(m) {
  return m === 'Card' ? 'card' : 'qr'
}

// Inicializa el flujo cada vez que se abre el dialog.
function reset() {
  error.value = ''
  createdPaymentId.value = null
  if (props.paymentId && props.method) {
    // Repago de pago existente: directo a tarjeta/QR.
    activeMethod.value = props.method
    step.value = stepForMethod(props.method)
  } else {
    activeMethod.value = ''
    step.value = 'method'
  }
}

watch(() => props.modelValue, (open) => { if (open) reset() })

async function chooseMethod(m) {
  activeMethod.value = m
  error.value = ''
  if (!props.payProvider) {
    step.value = stepForMethod(m)
    return
  }
  step.value = 'processing'
  try {
    const id = await props.payProvider(m)
    if (!id) throw new Error('No se genero el pago')
    createdPaymentId.value = id
    step.value = stepForMethod(m)
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'No se pudo iniciar el pago'
    step.value = 'method'
  }
}

function onPaid(payment) {
  step.value = 'success'
  emit('paid', payment)
}

function onVisible(v) {
  if (!v) close()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.method-intro { color: var(--carbon-300); font-size: 0.9rem; margin-bottom: 0.6rem; }
.amount-pill {
  display: inline-block; margin-bottom: 1rem; padding: 6px 12px; border-radius: 999px;
  background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); color: var(--carbon-200); font-size: 0.85rem;
}
.amount-pill strong { color: var(--gold-400); }
.method-card {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  background: var(--carbon-900); border: 1px solid var(--carbon-700); color: var(--carbon-100);
  border-radius: var(--radius-md); padding: 14px; cursor: pointer; margin-bottom: 10px;
  font-family: var(--font-family); transition: border-color 0.15s;
}
.method-card:hover { border-color: var(--gold-500); }
.method-card > i:first-child { font-size: 22px; color: var(--gold-400); }
.method-card div { flex: 1; display: flex; flex-direction: column; }
.method-card div strong { font-size: 0.95rem; }
.method-card div span { color: var(--carbon-400); font-size: 0.78rem; }
.method-card .go { color: var(--carbon-500); font-size: 14px; }
.checkout-error { color: var(--danger); font-size: 0.82rem; margin-top: 6px; }
.processing-step { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem 0; color: var(--carbon-300); }
.sandbox-hint {
  display: flex; gap: 10px; align-items: flex-start;
  background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.3);
  border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 14px;
}
.sandbox-hint i { color: #93c5fd; margin-top: 2px; }
.sandbox-hint strong { display: block; color: var(--carbon-100); font-size: 0.82rem; }
.sandbox-hint span { color: var(--carbon-400); font-size: 0.76rem; }
.success-step { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; padding: 1rem 0; text-align: center; }
.success-step h3 { color: var(--carbon-50); font-size: 1.25rem; font-weight: 800; }
.success-step p { color: var(--carbon-400); font-size: 0.9rem; }
.check-circle { width: 68px; height: 68px; border-radius: 50%; background: rgba(74,222,128,0.12); color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 34px; animation: pop 0.4s ease; }
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.primary-btn { margin-top: 0.5rem; border: none; cursor: pointer; background: var(--gradient-gold); color: var(--carbon-950); font-weight: 800; padding: 11px 28px; border-radius: var(--radius-md); font-family: var(--font-family); }
.spinner.big { width: 40px; height: 40px; border: 4px solid var(--gold-400); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
