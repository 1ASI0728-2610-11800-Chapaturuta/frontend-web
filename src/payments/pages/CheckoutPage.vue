<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PaymentForm from '@/payments/components/PaymentForm.vue'
import { PaymentService } from '@/payments/services/payment.service.js'
import { PayUService } from '@/payments/services/payu.service.js'
import { Payment, PaymentStatus } from '@/payments/models/payment.entity.js'

/**
 * Pagina de checkout. Orquesta el flujo de pago con tarjeta:
 *   1. create payment  (POST v1/payments)            -> Payment (Pending)
 *   2. payu charge      (POST v1/payments/payu/{id}/charge) -> confirma en backend
 *   3. refrescar estado (GET v1/payments/{id})        -> Completed | Failed
 *
 * Recibe el contexto del pago por props; si no llegan, hace fallback a query params
 * para poder navegar a /checkout?amount=...&fkIdUser=...&referenceType=...&referenceId=...
 */
const props = defineProps({
  /** ID del usuario IAM que paga (CreatePaymentResource.fkIdUser). */
  fkIdUser: { type: [Number, String], default: null },
  /** Monto a pagar (CreatePaymentResource.amount). */
  amount: { type: [Number, String], default: null },
  /** Moneda ISO (CreatePaymentResource.currency). */
  currency: { type: String, default: 'PEN' },
  /** Tipo de referencia que origina el pago: Reservation | Subscription. */
  referenceType: { type: String, default: '' },
  /** ID de la entidad referenciada (ej. id de reserva). */
  referenceId: { type: [Number, String], default: null }
})

const route = useRoute()

// Props con fallback a query params (props tienen prioridad).
const fkIdUser = computed(() => props.fkIdUser ?? route.query.fkIdUser ?? null)
const amount = computed(() => Number(props.amount ?? route.query.amount ?? 0))
const currency = computed(() => props.currency || route.query.currency || 'PEN')
const referenceType = computed(() => props.referenceType || route.query.referenceType || '')
const referenceId = computed(() => props.referenceId ?? route.query.referenceId ?? null)

const paymentService = new PaymentService()
const payuService = new PayUService()

const formRef = ref(null)
const submitting = ref(false)
const payment = ref(null)          // instancia de Payment con el estado mas reciente
const errorMessage = ref('')

const hasValidContext = computed(() =>
    fkIdUser.value != null && amount.value > 0 &&
    referenceType.value && referenceId.value != null
)

const status = computed(() => payment.value?.status ?? null)
const isCompleted = computed(() => status.value === PaymentStatus.COMPLETED)
const isFailed = computed(() => status.value === PaymentStatus.FAILED)
const isPending = computed(() => status.value === PaymentStatus.PENDING)

/**
 * Maneja el submit del PaymentForm.
 * @param {Object} chargeResource - PayUChargeResource armado por el form
 */
async function handlePay(chargeResource) {
  if (!hasValidContext.value) {
    errorMessage.value = 'Faltan datos del pago (monto o referencia).'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    // 1. Crear el pago (queda en estado Pending).
    const created = await paymentService.create({
      fkIdUser: Number(fkIdUser.value),
      amount: amount.value,
      currency: currency.value,
      method: 'Card',
      referenceType: referenceType.value,
      referenceId: Number(referenceId.value)
    })
    payment.value = new Payment(created)

    // 2. Cargar la tarjeta tokenizada via PayU. Si tiene exito, el backend
    //    confirma el pago internamente con la externalReference.
    await payuService.charge(payment.value.id, chargeResource)

    // 3. Refrescar el estado real desde el backend.
    const refreshed = await paymentService.getById(payment.value.id)
    payment.value = new Payment(refreshed)

    if (payment.value.isFailed) {
      errorMessage.value = 'El pago fue rechazado por la pasarela.'
    } else if (payment.value.isCompleted) {
      formRef.value?.reset()
    }
  } catch (error) {
    // Si el cargo fallo y el pago ya existe, intentamos marcarlo como fallido.
    if (payment.value?.id) {
      try {
        const failed = await paymentService.fail(payment.value.id)
        payment.value = new Payment(failed)
      } catch { /* el backend pudo haberlo marcado ya */ }
    }
    errorMessage.value = error?.data?.message
        || error?.message
        || 'Ocurrio un error al procesar el pago.'
  } finally {
    submitting.value = false
  }
}

/** Permite reintentar tras un fallo (limpia el pago para crear uno nuevo). */
function retry() {
  payment.value = null
  errorMessage.value = ''
}

onMounted(() => {
  if (!hasValidContext.value) {
    errorMessage.value = 'No se recibieron los datos del pago. '
        + 'Vuelve atras e intenta nuevamente.'
  }
})
</script>

<template>
  <main class="checkout-page">
    <pb-Card class="checkout-card">
      <template #title>
        <span class="checkout-title">Pagar con tarjeta</span>
      </template>

      <template #content>
        <!-- Estado exitoso -->
        <div v-if="isCompleted" class="checkout-result checkout-result--ok">
          <pb-Message severity="success" :closable="false">
            Pago completado correctamente.
          </pb-Message>
          <dl class="checkout-summary">
            <div><dt>Pago N°</dt><dd>{{ payment.id }}</dd></div>
            <div><dt>Monto</dt><dd>{{ payment.formattedAmount }}</dd></div>
            <div v-if="payment.externalReference">
              <dt>Referencia</dt><dd>{{ payment.externalReference }}</dd>
            </div>
          </dl>
        </div>

        <!-- Estado fallido -->
        <div v-else-if="isFailed" class="checkout-result checkout-result--fail">
          <pb-Message severity="error" :closable="false">
            {{ errorMessage || 'El pago no pudo completarse.' }}
          </pb-Message>
          <pb-Button label="Reintentar" class="checkout-retry" @click="retry" />
        </div>

        <!-- Formulario de pago (contexto valido) -->
        <template v-else-if="hasValidContext">
          <pb-Message v-if="errorMessage" severity="warn" :closable="false" class="checkout-inline-error">
            {{ errorMessage }}
          </pb-Message>

          <div v-if="submitting && isPending" class="checkout-pending">
            <pb-ProgressSpinner style="width:40px;height:40px" stroke-width="4" />
            <span>Procesando tu pago…</span>
          </div>

          <PaymentForm
              ref="formRef"
              :amount="amount"
              :currency="currency"
              :submitting="submitting"
              @submit="handlePay"
          />
        </template>

        <!-- Contexto invalido -->
        <pb-Message v-else severity="warn" :closable="false">
          {{ errorMessage }}
        </pb-Message>
      </template>
    </pb-Card>
  </main>
</template>

<style scoped>
.checkout-page {
  min-height: 100%;
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--surface);
  font-family: var(--font-family);
}

.checkout-card {
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.checkout-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ink);
}

.checkout-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkout-summary {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.checkout-summary > div {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--carbon-700);
  padding-bottom: 0.4rem;
}
.checkout-summary dt {
  color: var(--carbon-400);
  font-size: 0.85rem;
  font-weight: 600;
}
.checkout-summary dd {
  margin: 0;
  color: var(--ink);
  font-weight: 600;
}

.checkout-retry {
  align-self: flex-start;
}

.checkout-inline-error {
  margin-bottom: 1rem;
}

.checkout-pending {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: var(--carbon-300);
  font-size: 0.9rem;
}
</style>
