<template>
  <div class="qr-pay">
    <div class="qr-head">
      <!-- Logo Yape -->
      <span v-if="method === 'Yape'" class="brand-logo yape" aria-label="Yape">
        <svg viewBox="0 0 40 40" width="40" height="40" role="img" aria-label="Yape">
          <rect width="40" height="40" rx="11" fill="#742284" />
          <text x="50%" y="50%" dy="0.36em" text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700"
                fill="#ffffff" letter-spacing="0.2">Yape</text>
        </svg>
      </span>
      <!-- Logo Plin -->
      <span v-else class="brand-logo plin" aria-label="Plin">
        <svg viewBox="0 0 40 40" width="40" height="40" role="img" aria-label="Plin">
          <defs>
            <linearGradient id="plinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#00C2C7" />
              <stop offset="1" stop-color="#0096C7" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="11" fill="url(#plinGrad)" />
          <text x="50%" y="50%" dy="0.36em" text-anchor="middle"
                font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700"
                fill="#ffffff" letter-spacing="0.2">plin</text>
        </svg>
      </span>
      <div>
        <h3>Paga con {{ methodLabel }}</h3>
        <p>Escanea el codigo con tu app de {{ methodLabel }}</p>
      </div>
    </div>

    <p v-if="recipient" class="qr-recipient">
      <i class="pi pi-user"></i> Paga a <strong>{{ recipient }}</strong>
    </p>

    <div class="qr-box" :class="method.toLowerCase()">
      <QrcodeVue
        :value="confirmUrl"
        :size="200"
        level="M"
        render-as="svg"
        :foreground="qrColor"
      />
    </div>

    <p class="qr-amount">Monto: <strong>S/ {{ Number(amount || 0).toFixed(2) }}</strong></p>

    <div class="qr-poll">
      <span class="spinner"></span>
      Esperando confirmacion del pago...
    </div>

    <button class="simulate-btn" type="button" :disabled="processing" @click="simulate">
      <span v-if="processing" class="spinner dark"></span>
      <i v-else class="pi pi-mobile"></i>
      {{ processing ? 'Confirmando...' : 'Simular pago escaneado' }}
    </button>

    <p v-if="error" class="qr-error">{{ error }}</p>
    <p class="qr-hint">
      <i class="pi pi-info-circle"></i>
      Demo: escanea el QR con tu celular o usa "Simular pago" para confirmar en esta pantalla.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { PaymentService } from '@/payments/services/payment.service.js'

const props = defineProps({
  paymentId: { type: [Number, String], required: true },
  amount: { type: [Number, String], default: 0 },
  method: { type: String, default: 'Yape' }, // Yape | Plin
  recipient: { type: String, default: '' } // destinatario (ej. nombre del conductor)
})
const emit = defineEmits(['paid', 'error'])

const service = new PaymentService()
const processing = ref(false)
const error = ref('')
let pollId = null

const methodLabel = computed(() => (props.method === 'Plin' ? 'Plin' : 'Yape'))
// Tinta del QR a juego con la marca (Yape morado, Plin turquesa).
const qrColor = computed(() => (props.method === 'Plin' ? '#0096C7' : '#742284'))

// El QR codifica la vista publica de exito: al escanear con el celular se abre
// /pago-exitoso?paymentId=X, que confirma el pago en el backend.
const confirmUrl = computed(
  () => `${window.location.origin}/pago-exitoso?paymentId=${props.paymentId}`
)

async function simulate() {
  if (processing.value) return
  processing.value = true
  error.value = ''
  try {
    const result = await service.confirmPayment(props.paymentId)
    stopPolling()
    emit('paid', result)
  } catch (err) {
    const detail = err?.data?.message || err?.message || 'No se pudo confirmar el pago'
    error.value = detail
    emit('error', detail)
  } finally {
    processing.value = false
  }
}

// Polling: detecta cuando el pago fue confirmado desde otro dispositivo (QR escaneado).
async function poll() {
  try {
    const payment = await service.getPaymentById(props.paymentId)
    if (payment && String(payment.status).toLowerCase() === 'completed') {
      stopPolling()
      emit('paid', payment)
    }
  } catch {
    /* reintenta en el siguiente tick */
  }
}

function stopPolling() {
  if (pollId) { clearInterval(pollId); pollId = null }
}

onMounted(() => { pollId = setInterval(poll, 3000) })
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.qr-pay { display: flex; flex-direction: column; align-items: center; gap: 0.9rem; text-align: center; }
.qr-head { display: flex; align-items: center; gap: 10px; text-align: left; }
.brand-logo { flex: none; line-height: 0; border-radius: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
.brand-logo svg { display: block; }
.qr-head h3 { color: var(--carbon-50); font-size: 1.05rem; font-weight: 700; }
.qr-head p { color: var(--carbon-400); font-size: 0.8rem; }
.qr-box { background: #fff; padding: 14px; border-radius: var(--radius-md); line-height: 0; border: 3px solid transparent; }
.qr-box.yape { border-color: #742284; }
.qr-box.plin { border-color: #00C2C7; }
.qr-recipient { color: var(--carbon-300); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; }
.qr-recipient i { color: var(--gold-400); }
.qr-recipient strong { color: var(--carbon-100); }
.qr-amount { color: var(--carbon-200); font-size: 0.95rem; }
.qr-amount strong { color: var(--gold-400); }
.qr-poll { display: inline-flex; align-items: center; gap: 8px; color: var(--carbon-400); font-size: 0.82rem; }
.simulate-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; border: none; cursor: pointer;
  background: var(--gradient-gold); color: var(--carbon-950); font-weight: 800;
  padding: 11px 14px; border-radius: var(--radius-md); font-family: var(--font-family);
}
.simulate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.qr-error { color: var(--danger); font-size: 0.8rem; }
.qr-hint { color: var(--carbon-500); font-size: 11px; display: flex; align-items: center; gap: 6px; }
.spinner { width: 14px; height: 14px; border: 2px solid var(--carbon-400); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner.dark { border-color: var(--carbon-950); border-top-color: transparent; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
