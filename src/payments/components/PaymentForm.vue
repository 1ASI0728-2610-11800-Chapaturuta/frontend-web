<script setup>
import { ref, computed } from 'vue'

/**
 * Formulario de pago con tarjeta via PayU.
 *
 * Captura los datos del payer y de la tarjeta que el backend espera en
 * PayUChargeResource (Payments/Interfaces/REST/Resources/PayUChargeResource.cs).
 *
 * No persiste nada: emite el payload listo y deja que el padre (CheckoutPage)
 * orqueste create-payment -> payu charge. Asi el form queda desacoplado del servicio.
 */
const props = defineProps({
  /** Monto a pagar (solo lectura, lo fija el padre desde la referencia). */
  amount: { type: [Number, String], required: true },
  /** Moneda ISO del monto. */
  currency: { type: String, default: 'PEN' },
  /** Estado de envio controlado por el padre (mientras procesa el cargo). */
  submitting: { type: Boolean, default: false }
})

/** Emite { cardToken, payer..., paymentMethodBrand, deviceSessionId, ... } listo para PayUService.charge. */
const emit = defineEmits(['submit'])

// --- Datos del payer (PayUChargeResource) ---
const payerFullName = ref('')
const payerEmail = ref('')
const payerDocumentNumber = ref('')
const paymentMethodBrand = ref('VISA')

// --- Datos de tarjeta (solo para tokenizar en el navegador; NO se envian al backend en claro) ---
const cardNumber = ref('')
const cardExpiry = ref('')   // MM/YY
const cardCvv = ref('')
const cardHolder = ref('')

const brandOptions = [
  { label: 'Visa', value: 'VISA' },
  { label: 'Mastercard', value: 'MASTERCARD' },
  { label: 'American Express', value: 'AMEX' },
  { label: 'Diners Club', value: 'DINERS' }
]

const canSubmit = computed(() =>
    !props.submitting &&
    payerFullName.value.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(payerEmail.value) &&
    payerDocumentNumber.value.trim().length > 0 &&
    cardNumber.value.replace(/\s/g, '').length >= 13 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry.value) &&
    cardCvv.value.trim().length >= 3
)

/**
 * Genera el cardToken y el deviceSessionId.
 *
 * TODO (CONFIRMAR CON BACKEND): el modelo de tokenizacion PayU NO esta confirmado.
 * En produccion `cardToken` y `deviceSessionId` deben generarse con el SDK JS de PayU
 * (payu.js / Web Checkout tokenization) ejecutado en el navegador, de modo que el
 * numero de tarjeta NUNCA llegue al backend ni a este servidor (cumplimiento PCI).
 *
 * Pasos esperados cuando se integre el SDK PayU JS:
 *   1. Cargar el script de PayU y configurar merchantId / accountId / apiLogin (lado cliente).
 *   2. payU.setLanguage('es'); payU.setURL(...); payU.setPublicKey(...);
 *   3. payU.setAccountID(...); payU.getDeviceSessionID()  -> deviceSessionId
 *   4. payU.setCardDetails({ number, name_card, payer_id, exp_month, exp_year, method, cvv })
 *   5. payU.createToken(callback) -> token (cardToken)
 *
 * Mientras tanto, dejamos placeholders deterministas para no romper el flujo en dev.
 * El backend rechazara estos tokens falsos (esperado hasta integrar el SDK real).
 */
function buildTokenizationStub() {
  const [expMonth, expYear] = cardExpiry.value.split('/')
  return {
    // TODO: reemplazar por payU.createToken(...) del SDK JS de PayU.
    cardToken: `STUB-${paymentMethodBrand.value}-${cardNumber.value.replace(/\s/g, '').slice(-4)}-${expMonth}${expYear}`,
    // TODO: reemplazar por payU.getDeviceSessionID() del SDK JS de PayU.
    deviceSessionId: `STUB-DEVICE-${Date.now()}`
  }
}

function onSubmit() {
  if (!canSubmit.value) return

  const { cardToken, deviceSessionId } = buildTokenizationStub()

  // Payload con el casing EXACTO de PayUChargeResource (camelCase).
  emit('submit', {
    cardToken,
    payerFullName: payerFullName.value.trim(),
    payerEmail: payerEmail.value.trim(),
    payerDocumentNumber: payerDocumentNumber.value.trim(),
    paymentMethodBrand: paymentMethodBrand.value,
    payerIpAddress: '',                 // el backend puede inferirlo del request si llega vacio
    deviceSessionId,
    payerUserAgent: navigator.userAgent,
    payerCookie: document.cookie || ''
  })
}

/** Limpia los datos sensibles de tarjeta (util tras un cargo exitoso). */
function reset() {
  cardNumber.value = ''
  cardExpiry.value = ''
  cardCvv.value = ''
  cardHolder.value = ''
}

defineExpose({ reset })
</script>

<template>
  <form class="payment-form" @submit.prevent="onSubmit">
    <div class="pf-amount">
      <span class="pf-amount-label">Total a pagar</span>
      <span class="pf-amount-value">{{ currency }} {{ Number(amount).toFixed(2) }}</span>
    </div>

    <section class="pf-section">
      <h3 class="pf-section-title">Datos del pagador</h3>

      <div class="pf-field">
        <label class="pf-label" for="pf-name">Nombre completo</label>
        <pb-InputText id="pf-name" v-model="payerFullName" class="pf-control"
                      placeholder="Nombre y apellidos" :disabled="submitting" />
      </div>

      <div class="pf-row">
        <div class="pf-field">
          <label class="pf-label" for="pf-email">Email</label>
          <pb-InputText id="pf-email" v-model="payerEmail" class="pf-control"
                        type="email" placeholder="correo@ejemplo.com" :disabled="submitting" />
        </div>
        <div class="pf-field">
          <label class="pf-label" for="pf-doc">DNI</label>
          <pb-InputText id="pf-doc" v-model="payerDocumentNumber" class="pf-control"
                        placeholder="12345678" :disabled="submitting" />
        </div>
      </div>
    </section>

    <section class="pf-section">
      <h3 class="pf-section-title">Datos de la tarjeta</h3>

      <div class="pf-field">
        <label class="pf-label" for="pf-brand">Marca</label>
        <pb-Select id="pf-brand" v-model="paymentMethodBrand" :options="brandOptions"
                   option-label="label" option-value="value" class="pf-control"
                   :disabled="submitting" />
      </div>

      <div class="pf-field">
        <label class="pf-label" for="pf-holder">Titular de la tarjeta</label>
        <pb-InputText id="pf-holder" v-model="cardHolder" class="pf-control"
                      placeholder="Como aparece en la tarjeta" :disabled="submitting" />
      </div>

      <div class="pf-field">
        <label class="pf-label" for="pf-number">Numero de tarjeta</label>
        <pb-InputText id="pf-number" v-model="cardNumber" class="pf-control"
                      inputmode="numeric" placeholder="0000 0000 0000 0000" :disabled="submitting" />
      </div>

      <div class="pf-row">
        <div class="pf-field">
          <label class="pf-label" for="pf-expiry">Vencimiento (MM/YY)</label>
          <pb-InputText id="pf-expiry" v-model="cardExpiry" class="pf-control"
                        placeholder="MM/YY" maxlength="5" :disabled="submitting" />
        </div>
        <div class="pf-field">
          <label class="pf-label" for="pf-cvv">CVV</label>
          <pb-InputText id="pf-cvv" v-model="cardCvv" class="pf-control"
                        inputmode="numeric" placeholder="123" maxlength="4" :disabled="submitting" />
        </div>
      </div>

      <p class="pf-secure-note">
        Los datos de tu tarjeta se tokenizan en el navegador con PayU. No se almacenan
        en nuestros servidores.
      </p>
    </section>

    <pb-Button type="submit" class="pf-submit" :disabled="!canSubmit"
               :label="submitting ? 'Procesando pago...' : 'Pagar ahora'" />
  </form>
</template>

<style scoped>
.payment-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: var(--ink);
  font-family: var(--font-family);
}

.pf-amount {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0.9rem 1.1rem;
  background: var(--gold-100);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
}
.pf-amount-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--carbon-300);
}
.pf-amount-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--gold-600);
}

.pf-section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.pf-section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--carbon-200);
}

.pf-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
}

.pf-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.pf-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--carbon-400);
}
.pf-control {
  width: 100%;
}

.pf-secure-note {
  margin: 0;
  font-size: 0.75rem;
  color: var(--carbon-500);
}

.pf-submit {
  align-self: stretch;
  margin-top: 0.25rem;
}

@media (max-width: 480px) {
  .pf-row {
    grid-template-columns: 1fr;
  }
}
</style>
