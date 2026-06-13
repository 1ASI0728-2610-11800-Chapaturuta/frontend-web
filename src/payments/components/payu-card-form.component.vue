<template>
  <form class="payu-form" @submit.prevent="submit">
    <p class="payu-amount">Total a pagar: <strong>S/ {{ Number(amount || 0).toFixed(2) }}</strong></p>

    <label class="field">
      <span>Titular de la tarjeta</span>
      <input v-model.trim="card.holder" placeholder="Nombre como aparece en la tarjeta" />
    </label>

    <label class="field">
      <span>Número de tarjeta</span>
      <input
        v-model="card.number"
        inputmode="numeric"
        maxlength="19"
        placeholder="4111 1111 1111 1111"
        @input="formatNumber"
      />
      <small v-if="brand" class="brand-tag">{{ brand }}</small>
    </label>

    <div class="row">
      <label class="field">
        <span>Vencimiento</span>
        <input v-model="card.expiry" maxlength="5" placeholder="MM/AA" @input="formatExpiry" />
      </label>
      <label class="field">
        <span>CVV</span>
        <input v-model="card.cvv" inputmode="numeric" maxlength="4" placeholder="123" />
      </label>
    </div>

    <div class="row">
      <label class="field">
        <span>Email del pagador</span>
        <input v-model.trim="card.payerEmail" type="email" placeholder="correo@ejemplo.com" />
      </label>
      <label class="field">
        <span>Documento</span>
        <input v-model.trim="card.payerDocument" placeholder="DNI" />
      </label>
    </div>

    <p v-if="formError" class="form-error">{{ formError }}</p>

    <button class="pay-btn" type="submit" :disabled="processing">
      <span v-if="processing" class="spinner"></span>
      {{ processing ? 'Procesando...' : 'Pagar' }}
    </button>

    <p class="pci-note">
      <i class="pi pi-lock"></i>
      Los datos de tu tarjeta se tokenizan con PayU; el número completo no se almacena en nuestros servidores.
    </p>
  </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PaymentService } from '@/payments/services/payment.service.js'
import { required, email as emailRule, cardNumber, expiryMMYY, cvv as cvvRule, dni } from '@/shared/validation/validators.js'

const props = defineProps({
  paymentId: { type: [Number, String], required: true },
  amount: { type: [Number, String], default: 0 }
})
const emit = defineEmits(['paid', 'error'])

const service = new PaymentService()
const processing = ref(false)
const formError = ref('')
const deviceSessionId = ref('')

const card = ref({
  holder: '',
  number: '',
  expiry: '',
  cvv: '',
  payerEmail: '',
  payerDocument: ''
})

const digits = computed(() => card.value.number.replace(/\D/g, ''))
const brand = computed(() => {
  const n = digits.value
  if (/^4/.test(n)) return 'VISA'
  if (/^5[1-5]/.test(n)) return 'MASTERCARD'
  if (/^3[47]/.test(n)) return 'AMEX'
  if (/^6/.test(n)) return 'DINERS'
  return ''
})

function formatNumber() {
  const n = digits.value.slice(0, 16)
  card.value.number = n.replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry() {
  const n = card.value.expiry.replace(/\D/g, '').slice(0, 4)
  card.value.expiry = n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n
}

// PayU usa un deviceSessionId para antifraude. Si el script de PayU (fraud
// detection) está cargado expone window.deviceSessionId; si no, generamos uno
// determinístico-ish para el sandbox. Reemplazar por el SDK real en producción.
function buildDeviceSessionId() {
  if (typeof window !== 'undefined' && window.deviceSessionId) return window.deviceSessionId
  const seed = `${props.paymentId}-${navigator.userAgent}-${performance.now()}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return `dsid_${hash.toString(16)}`
}

onMounted(() => { deviceSessionId.value = buildDeviceSessionId() })

function validate() {
  return required(card.value.holder, 'El titular de la tarjeta')
    || cardNumber(card.value.number)
    || expiryMMYY(card.value.expiry)
    || cvvRule(card.value.cvv)
    || emailRule(card.value.payerEmail)
    || dni(card.value.payerDocument) // backend exige PayerDocumentNumber (DNI 8 dígitos)
}

async function submit() {
  formError.value = validate()
  if (formError.value) return

  processing.value = true
  try {
    const [mm, yy] = card.value.expiry.split('/')
    // Contrato PayUChargeResource (tarjeta cruda, sandbox). expirationDate = YYYY/MM.
    // IP / User-Agent los completa el backend desde la petición si van vacíos.
    const payload = {
      cardNumber: digits.value,
      cardSecurityCode: card.value.cvv,
      cardExpirationDate: `20${yy}/${mm}`,
      cardHolderName: card.value.holder,
      payerFullName: card.value.holder,
      payerEmail: card.value.payerEmail,
      payerDocumentNumber: card.value.payerDocument,
      paymentMethodBrand: brand.value || 'VISA',
      deviceSessionId: deviceSessionId.value
    }
    const result = await service.chargePayU(props.paymentId, payload)
    emit('paid', result)
  } catch (err) {
    const detail = err?.friendlyMessage || err?.data?.message || err?.message || 'No se pudo procesar el pago'
    formError.value = detail
    emit('error', detail)
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.payu-form { display: flex; flex-direction: column; gap: 0.9rem; }
.payu-amount { font-size: 0.95rem; color: var(--carbon-200); }
.payu-amount strong { color: var(--gold-400); }
.field { display: flex; flex-direction: column; gap: 6px; position: relative; }
.field span { color: var(--carbon-400); font-size: 11px; text-transform: uppercase; font-weight: 600; }
.field input {
  width: 100%; padding: 10px 12px; border-radius: var(--radius-md);
  border: 1px solid var(--carbon-600); background: var(--carbon-900); color: var(--carbon-100);
  font-family: var(--font-family);
}
.field input:focus { outline: none; border-color: var(--gold-500); }
.brand-tag { position: absolute; right: 10px; top: 30px; font-size: 11px; font-weight: 700; color: var(--gold-400); }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-error { color: var(--danger); font-size: 0.8rem; }
.pay-btn {
  border: none; background: var(--gradient-gold); color: var(--carbon-950); font-weight: 700;
  border-radius: var(--radius-md); padding: 12px; cursor: pointer; display: inline-flex;
  align-items: center; justify-content: center; gap: 8px; font-family: var(--font-family);
}
.pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 14px; height: 14px; border: 2px solid var(--carbon-950); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.pci-note { font-size: 11px; color: var(--carbon-500); display: flex; align-items: center; gap: 6px; }
</style>
