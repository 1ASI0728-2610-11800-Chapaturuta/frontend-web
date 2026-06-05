<template>
  <pb-Card class="res-form-card">
    <template #title>
      <div class="form-head">
        <i class="pi pi-ticket"></i>
        <span>Reservar asientos</span>
      </div>
    </template>

    <template #subtitle>
      <span class="form-sub">
        Viaje #{{ tripId ?? '—' }}
        <template v-if="maxSeats != null">
          &middot; {{ maxSeats }} {{ maxSeats === 1 ? 'asiento disponible' : 'asientos disponibles' }}
        </template>
      </span>
    </template>

    <template #content>
      <form class="res-form" @submit.prevent="onSubmit">
        <!-- Tipo de documento -->
        <div class="field">
          <label for="documentType">Tipo de documento</label>
          <pb-Select
            inputId="documentType"
            v-model="form.documentType"
            :options="documentTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona"
            class="full"
          />
        </div>

        <!-- Numero de documento -->
        <div class="field">
          <label for="documentNumber">Numero de documento</label>
          <pb-InputText
            id="documentNumber"
            v-model="form.documentNumber"
            placeholder="Ej. 71234567"
            class="full"
            :maxlength="12"
          />
        </div>

        <!-- Asientos -->
        <div class="field">
          <label for="seats">Asientos a reservar</label>
          <pb-InputNumber
            inputId="seats"
            v-model="form.seats"
            :min="1"
            :max="maxSeats ?? 99"
            showButtons
            class="full"
          />
        </div>

        <!-- Metodo de pago (el cobro real lo gestiona el modulo payments) -->
        <div class="field">
          <label for="paymentMethod">Metodo de pago</label>
          <pb-Select
            inputId="paymentMethod"
            v-model="form.paymentMethod"
            :options="paymentMethodOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona"
            class="full"
          />
        </div>

        <!-- Validacion / error -->
        <pb-Message v-if="validationError" severity="warn" :closable="false" class="form-msg">
          {{ validationError }}
        </pb-Message>
        <pb-Message v-if="error" severity="error" :closable="false" class="form-msg">
          {{ error }}
        </pb-Message>

        <div class="actions">
          <pb-Button
            type="button"
            label="Cancelar"
            severity="secondary"
            outlined
            :disabled="submitting"
            @click="$emit('cancel')"
          />
          <pb-Button
            type="submit"
            label="Reservar"
            icon="pi pi-check"
            class="btn-primary"
            :loading="submitting"
          />
        </div>
      </form>
    </template>
  </pb-Card>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ReservationService } from '@/reservations/services/reservation.service.js'
import {
  DOCUMENT_TYPE,
  PAYMENT_METHOD
} from '@/reservations/models/reservation.entity.js'

const props = defineProps({
  /**
   * Objeto trip completo (TripResource) del cual leemos id y asientos disponibles.
   * Opcional si se pasa `tripId` directamente.
   */
  trip: { type: Object, default: null },
  /** Id del viaje. Tiene prioridad sobre trip.id si se provee. */
  tripId: { type: [Number, String], default: null },
  /**
   * Si es true (por defecto), el componente llama a ReservationService.create.
   * Si es false, solo emite `create` con el payload para que el padre lo maneje.
   */
  autoSubmit: { type: Boolean, default: true }
})

const emit = defineEmits(['create', 'created', 'error', 'cancel'])

const svc = new ReservationService()

const submitting      = ref(false)
const error           = ref('')
const validationError = ref('')

const tripId = computed(() => props.tripId ?? props.trip?.id ?? null)
const maxSeats = computed(() => {
  const s = props.trip?.availableSeats
  return typeof s === 'number' ? s : null
})

// El backend solo soporta DocumentType.Dni (no existe "Ce"), por eso es la
// unica opcion. La conversion string->int la realiza ReservationService.
const documentTypeOptions = [
  { label: 'DNI', value: DOCUMENT_TYPE.DNI }
]

const paymentMethodOptions = [
  { label: 'Yape', value: PAYMENT_METHOD.YAPE },
  { label: 'Plin', value: PAYMENT_METHOD.PLIN },
  { label: 'Tarjeta', value: PAYMENT_METHOD.CARD },
  { label: 'Efectivo', value: PAYMENT_METHOD.CASH }
]

const form = reactive({
  documentType: DOCUMENT_TYPE.DNI,
  documentNumber: '',
  seats: 1,
  paymentMethod: PAYMENT_METHOD.YAPE
})

const validate = () => {
  validationError.value = ''
  if (tripId.value == null) {
    validationError.value = 'No se identifico el viaje a reservar.'
    return false
  }
  if (!form.documentNumber || !String(form.documentNumber).trim()) {
    validationError.value = 'Ingresa el numero de documento.'
    return false
  }
  if (!form.seats || form.seats < 1) {
    validationError.value = 'Debes reservar al menos un asiento.'
    return false
  }
  if (maxSeats.value != null && form.seats > maxSeats.value) {
    validationError.value = `Solo hay ${maxSeats.value} asientos disponibles.`
    return false
  }
  return true
}

const buildPayload = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  // CreateReservationResource: fkIdUser, fkIdTrip, documentType, documentNumber, seats, paymentMethod
  // NOTA: fkIdPayment NO se envia al crear; el backend registra el pago pendiente
  // internamente (BC Payments via ACL) usando paymentMethod.
  return {
    fkIdUser: user.id ?? null,
    fkIdTrip: tripId.value,
    documentType: form.documentType,
    documentNumber: String(form.documentNumber).trim(),
    seats: form.seats,
    paymentMethod: form.paymentMethod
  }
}

const onSubmit = async () => {
  error.value = ''
  if (!validate()) return

  const payload = buildPayload()

  // Siempre notificamos el intento de creacion al padre (util para tracking).
  emit('create', payload)

  // Si el padre maneja el submit (autoSubmit=false), nos detenemos aqui.
  if (!props.autoSubmit) return

  submitting.value = true
  try {
    // ReservationService.create ya convierte los enums string->int al enviar y
    // devuelve una entidad Reservation con los enums normalizados int->string.
    const reservation = await svc.create(payload)

    // ──────────────────────────────────────────────────────────────────────
    // PUNTO DE INTEGRACION CON PAYMENTS (modulo a cargo de otro agente).
    // La reserva queda en estado Pending y el backend ya creo un pago pendiente
    // (reservation.fkIdPayment apunta a ese pago). Aqui el flujo de pago debe:
    //   1. Tomar reservation.fkIdPayment (si viene) o consultar el pago por la reserva.
    //   2. Lanzar el checkout / confirmacion de pago del modulo payments.
    //   3. Tras el pago OK, llamar a ReservationService.confirm(reservation.id).
    // Por ahora solo emitimos la reserva creada para que el contenedor decida
    // navegar al flujo de pago.
    // TODO(payments): conectar checkout con reservation.fkIdPayment / reservation.id
    // ──────────────────────────────────────────────────────────────────────

    emit('created', reservation)
  } catch (e) {
    error.value = e?.message || 'No se pudo crear la reserva.'
    emit('error', e)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.res-form-card {
  max-width: 440px;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.form-head {
  display: flex; align-items: center; gap: 10px;
  font-size: 1.1rem; font-weight: 700; color: var(--carbon-100);
}
.form-head i { color: var(--gold-600); }
.form-sub { font-size: 0.8rem; color: var(--carbon-400); }

.res-form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 0.8rem; font-weight: 600; color: var(--carbon-200); }
.full { width: 100%; }
.full :deep(.p-inputnumber),
.full :deep(.p-inputnumber-input),
.full :deep(.p-select) { width: 100%; }

.form-msg { margin: 0; }

.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 0.5rem; }
.btn-primary :deep(.p-button),
.btn-primary { --p-button-primary-background: var(--gold-600); }
</style>
