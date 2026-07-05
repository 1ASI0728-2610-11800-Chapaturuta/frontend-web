<template>
  <div class="trips-page">
    <div class="page-header">
      <h1 class="page-title">Historial de <span class="gold">Viajes</span></h1>
      <p class="page-sub">Tus últimos viajes realizados</p>
    </div>

    <div v-if="isLoading" class="skeleton-list">
      <div v-for="i in 5" :key="i" class="sk-row shimmer"></div>
    </div>

    <div v-else-if="trips.length > 0" class="trips-list">
      <div
        v-for="(trip, i) in trips"
        :key="trip.id"
        class="trip-row"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <div class="trip-icon"><i class="pi pi-directions"></i></div>
        <div class="trip-info">
          <h3>{{ trip.routeName || 'Ruta desconocida' }}</h3>
          <p>{{ originLabel(trip) }} → {{ destinationLabel(trip) }}</p>
          <p class="trip-people">
            <span v-if="trip.driverName"><i class="pi pi-user"></i> {{ trip.driverName }}</span>
            <span v-if="trip.passengerName"><i class="pi pi-users"></i> {{ trip.passengerName }}</span>
          </p>
        </div>
        <div class="trip-meta">
          <span class="status-badge" :class="statusClass(trip.status)">{{ statusLabel(trip.status) }}</span>
          <span v-if="trip.myReservationStatus" class="status-badge" :class="resvClass(trip.myReservationStatus)">
            <i class="pi pi-ticket"></i> Reserva: {{ resvLabel(trip.myReservationStatus) }}
          </span>
          <span v-if="trip.myReservationSeats != null" class="status-badge st-seats"><i class="pi pi-user-plus"></i> {{ trip.myReservationSeats }} reservado(s)</span>
          <span v-else-if="trip.availableSeats != null" class="status-badge st-seats"><i class="pi pi-users"></i> {{ trip.availableSeats }} asientos</span>
          <span v-if="isPaid(trip)" class="status-badge st-paid"><i class="pi pi-check-circle"></i> Pagado</span>
          <span class="trip-date">{{ formatDateTime(trip.startTime || trip.date) }}</span>
          <span class="trip-price">S/ {{ trip.price }}</span>
          <div v-if="!isDriver && canPay(trip)" class="trip-actions">
            <button
              class="act-btn act-pay"
              :disabled="acting === trip.id"
              @click="openPay(trip)"
            ><i class="pi pi-wallet"></i> Pagar viaje</button>
          </div>
          <div v-if="canRate(trip)" class="trip-actions">
            <button
              class="act-btn act-rate"
              @click="openRate(trip)"
            ><i class="pi pi-star"></i> Calificar</button>
          </div>
          <div v-if="isDriver" class="trip-actions">
            <button
              v-if="normalizeStatus(trip.status) === 'pending'"
              class="act-btn act-start"
              :disabled="acting === trip.id"
              @click="doAction(trip, 'start')"
            ><i class="pi pi-play"></i> Iniciar</button>
            <button
              v-if="normalizeStatus(trip.status) === 'inprogress'"
              class="act-btn act-complete"
              :disabled="acting === trip.id"
              @click="doAction(trip, 'complete')"
            ><i class="pi pi-check"></i> Completar</button>
            <button
              v-if="['pending','inprogress'].includes(normalizeStatus(trip.status))"
              class="act-btn act-cancel"
              :disabled="acting === trip.id"
              @click="doAction(trip, 'cancel')"
            ><i class="pi pi-times"></i> Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-map"></i>
      <p>No tienes viajes registrados</p>
      <span>Tus viajes aparecerán aquí una vez uses la plataforma</span>
    </div>

    <PaymentCheckoutDialog
      v-model="showPay"
      title="Pagar viaje"
      :amount="payTrip?.price || 0"
      :recipient="payTrip?.driverName || ''"
      success-message="Tu viaje fue pagado."
      :pay-provider="payTripProvider"
      @paid="onTripPaid"
    />

    <!-- Calificar al conductor de un viaje completado -->
    <pb-Dialog v-model:visible="showRate" modal header="Calificar viaje" :style="{ width: '24rem' }">
      <div v-if="rateTrip" class="rate-body">
        <p class="rate-route">{{ rateTrip.routeName || 'Viaje' }} · {{ rateTrip.driverName }}</p>
        <label>Tu calificación</label>
        <StarRating v-model="rateScore" />
        <label>Comentario (opcional)</label>
        <textarea v-model="rateComment" rows="3" maxlength="500" class="rate-input"
          placeholder="¿Cómo estuvo el viaje?"></textarea>
      </div>
      <template #footer>
        <pb-Button label="Cancelar" text @click="showRate = false" />
        <pb-Button label="Enviar reseña" icon="pi pi-star"
          :disabled="rateScore < 1" :loading="savingRate" @click="submitRate" />
      </template>
    </pb-Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { TripService } from '@/trips/services/trip.service.js'
import { PaymentService } from '@/payments/services/payment.service.js'
import { RatingService } from '@/ratings/services/rating.service.js'
import PaymentCheckoutDialog from '@/payments/components/payment-checkout-dialog.component.vue'
import StarRating from '@/shared/components/StarRating.vue'
import { getUserId, getDriverId } from '@/shared/services/session.service.js'
import { formatLima } from '@/shared/services/lima-time.js'

const trips     = ref([])
const isLoading = ref(false)
const acting    = ref(null)
const paidTripIds = ref(new Set())
const showPay   = ref(false)
const payTrip   = ref(null)
const svc = new TripService()
const paymentSvc = new PaymentService()
const ratingSvc = new RatingService()
const toast = useToast()

// Reseñas: viajes que el pasajero ya calificó (para no calificar dos veces).
const ratedTripIds = ref(new Set())
const showRate = ref(false)
const rateTrip = ref(null)
const rateScore = ref(0)
const rateComment = ref('')
const savingRate = ref(false)

const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
}
const isDriver = computed(() => Number(currentUser().role) === 2)

const originLabel = (t) => t.originName || t.origin || ''
const destinationLabel = (t) => t.destinationName || t.destination || ''

const formatDateTime = (value) => {
  if (!value) return ''
  return formatLima(value, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const normalizeStatus = (s) => String(s ?? '').toLowerCase().replace(/[\s_]/g, '')
const statusClass = (s) => ({
  pending: 'st-pending',
  inprogress: 'st-progress',
  completed: 'st-completed',
  cancelled: 'st-cancelled',
  canceled: 'st-cancelled'
}[normalizeStatus(s)] || 'st-pending')
const statusLabel = (s) => ({
  pending: 'Pendiente',
  inprogress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
  canceled: 'Cancelado'
}[normalizeStatus(s)] || (s || 'Pendiente'))

// Estado de la reserva del propio pasajero sobre el viaje (separado del estado del viaje).
const resvClass = (s) => ({
  pending: 'st-pending',
  confirmed: 'st-completed',
  completed: 'st-completed',
  cancelled: 'st-cancelled',
  canceled: 'st-cancelled',
  refunded: 'st-cancelled',
  expired: 'st-cancelled'
}[normalizeStatus(s)] || 'st-pending')
const resvLabel = (s) => ({
  pending: 'Pendiente de pago',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  canceled: 'Cancelada',
  refunded: 'Reembolsada',
  expired: 'Expirada'
}[normalizeStatus(s)] || (s || 'Pendiente'))

const load = async () => {
  isLoading.value = true
  try {
    if (isDriver.value) {
      const driverId = getDriverId()
      if (driverId) trips.value = await svc.getTripHistoryByDriverId(driverId)
    } else {
      const userId = getUserId()
      if (userId) {
        trips.value = await svc.getTripHistoryByUserId(userId)
        await loadPaidTrips(userId)
        await loadRatedTrips(userId)
      }
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.data?.message || 'No se pudo cargar el historial.', life: 4000 })
  } finally {
    isLoading.value = false
  }
}

// Estado "pagado" derivado de los pagos del usuario (referenceType "Trip", Completed).
const loadPaidTrips = async (userId) => {
  try {
    const payments = await paymentSvc.getPaymentsByUserId(userId)
    const ids = (payments || [])
      .filter(p => String(p.referenceType).toLowerCase() === 'trip'
        && String(p.status).toLowerCase() === 'completed')
      .map(p => Number(p.referenceId))
    paidTripIds.value = new Set(ids)
  } catch {
    paidTripIds.value = new Set()
  }
}

const isPaid = (trip) => paidTripIds.value.has(Number(trip.id))
// Si el pasajero ya tiene una reserva sobre este viaje, la reserva es el canal de
// pago (se paga en "Mis Reservas"). No debe ofrecerse "Pagar viaje" o se cobraría
// dos veces el mismo viaje (la reserva paga con referenceType 'Reservation', el
// pago de viaje con 'Trip', por eso isPaid no lo detectaba).
const hasReservation = (trip) =>
  ['pending', 'confirmed', 'completed'].includes(normalizeStatus(trip.myReservationStatus))
const canPay = (trip) =>
  !isPaid(trip) && !hasReservation(trip) && ['inprogress', 'completed'].includes(normalizeStatus(trip.status))

const openPay = (trip) => {
  payTrip.value = trip
  showPay.value = true
}

const payTripProvider = async (method) => {
  const userId = getUserId()
  const payment = await paymentSvc.createPayment({
    fkIdUser: userId,
    amount: Number(payTrip.value.price || 0),
    method,
    referenceType: 'Trip',
    referenceId: Number(payTrip.value.id),
    currency: 'PEN'
  })
  return payment?.id
}

const onTripPaid = async () => {
  toast.add({ severity: 'success', summary: 'Viaje pagado', life: 2500 })
  await load()
}

// ── Reseñas del viajero ──────────────────────────────────────────────────────
const loadRatedTrips = async (userId) => {
  try {
    const mine = await ratingSvc.getByUser(userId)
    ratedTripIds.value = new Set((mine || []).map(r => Number(r.fkIdTrip)))
  } catch {
    ratedTripIds.value = new Set()
  }
}

// Se puede calificar un viaje COMPLETADO donde hubo conductor y que aún no calificaste.
const canRate = (trip) =>
  !isDriver.value && normalizeStatus(trip.status) === 'completed'
  && !!trip.driverName && !ratedTripIds.value.has(Number(trip.id))

const openRate = (trip) => {
  rateTrip.value = trip
  rateScore.value = 0
  rateComment.value = ''
  showRate.value = true
}

const submitRate = async () => {
  const trip = rateTrip.value
  if (!trip) return
  if (rateScore.value < 1) {
    toast.add({ severity: 'warn', summary: 'Elige una calificación', detail: 'Selecciona de 1 a 5 estrellas.', life: 3000 })
    return
  }
  savingRate.value = true
  try {
    // El historial no trae el driverId; lo resolvemos del viaje (GET /trips/{id}).
    const full = await svc.getById(trip.id)
    const driverId = full?.fkIdDriver
    if (!driverId) {
      toast.add({ severity: 'warn', summary: 'Sin conductor', detail: 'Este viaje no tiene un conductor asignado para calificar.', life: 3500 })
      return
    }
    await ratingSvc.createRating({
      fkIdUser: getUserId(),
      fkIdDriver: driverId,
      fkIdTrip: trip.id,
      score: rateScore.value,
      comment: rateComment.value?.trim() || null
    })
    ratedTripIds.value = new Set([...ratedTripIds.value, Number(trip.id)])
    showRate.value = false
    toast.add({ severity: 'success', summary: 'Gracias por tu reseña', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.friendlyMessage || e?.data?.message || 'No se pudo enviar la reseña.', life: 4000 })
  } finally {
    savingRate.value = false
  }
}

const doAction = async (trip, action) => {
  acting.value = trip.id
  try {
    if (action === 'start') await svc.startTrip(trip.id)
    else if (action === 'complete') await svc.completeTrip(trip.id)
    else if (action === 'cancel') await svc.cancelTrip(trip.id)
    toast.add({ severity: 'success', summary: 'Viaje actualizado', life: 2500 })
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.data?.message || 'No se pudo actualizar el viaje.', life: 4000 })
  } finally {
    acting.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.trips-page { padding: 2rem; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.03em; }
.page-title .gold { color: var(--gold-400); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

.trips-list { display: flex; flex-direction: column; gap: 10px; }
.trip-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 1rem 1.5rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  animation: fadeUp 0.35s var(--ease-out-expo) both;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.trip-icon {
  width: 40px; height: 40px;
  background: rgba(139,92,246,0.08);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-500);
  flex-shrink: 0;
}
.trip-info { flex: 1; }
.trip-info h3 { font-size: 0.9rem; font-weight: 600; color: var(--carbon-100); }
.trip-info p { font-size: 0.8rem; color: var(--carbon-400); margin-top: 2px; }
.trip-people { display: flex; gap: 14px; }
.trip-people span { display: inline-flex; align-items: center; gap: 4px; }
.trip-people i { font-size: 0.7rem; }
.trip-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.trip-date { font-size: 0.75rem; color: var(--carbon-500); }
.trip-price { font-size: 0.9rem; font-weight: 700; color: var(--gold-400); }

.status-badge {
  font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  text-transform: uppercase; letter-spacing: 0.03em;
}
.st-pending   { background: rgba(138,138,138,0.15); color: var(--carbon-300); }
.st-progress  { background: rgba(251,191,36,0.15);  color: var(--warning); }
.st-completed { background: rgba(74,222,128,0.15);  color: var(--success); }
.st-cancelled { background: rgba(248,113,113,0.15); color: var(--danger); }
.st-paid { background: rgba(74,222,128,0.18); color: var(--success); display: inline-flex; align-items: center; gap: 4px; }
.st-paid i { font-size: 0.72rem; }
.st-seats { background: rgba(96,165,250,0.15); color: #60a5fa; display: inline-flex; align-items: center; gap: 4px; }
.st-seats i { font-size: 0.72rem; }

.trip-actions { display: flex; gap: 6px; margin-top: 4px; }
.act-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.72rem; font-weight: 600; padding: 4px 10px; border-radius: 6px;
  cursor: pointer; border: 1px solid transparent;
}
.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.act-start    { background: rgba(96,165,250,0.12); color: var(--info); border-color: rgba(96,165,250,0.3); }
.act-complete { background: rgba(74,222,128,0.12); color: var(--success); border-color: rgba(74,222,128,0.3); }
.act-cancel   { background: rgba(248,113,113,0.12); color: var(--danger); border-color: rgba(248,113,113,0.3); }
.act-pay      { background: rgba(139,92,246,0.14); color: var(--gold-400); border-color: rgba(139,92,246,0.35); }
.act-rate     { background: rgba(139,92,246,0.10); color: var(--gold-500); border-color: rgba(139,92,246,0.3); cursor: pointer; }

.rate-body { display: flex; flex-direction: column; gap: 8px; }
.rate-route { color: var(--carbon-100); font-weight: 600; font-size: 0.9rem; }
.rate-body label { font-size: 0.8rem; color: var(--carbon-400); }
.rate-input { padding: 10px 12px; background: var(--carbon-900); border: 1px solid var(--carbon-700); border-radius: 8px; color: var(--carbon-100); font-family: var(--font-family); resize: vertical; }
.rate-input:focus { outline: none; border-color: var(--gold-500); }

.skeleton-list { display: flex; flex-direction: column; gap: 10px; }
.sk-row { height: 68px; background: var(--carbon-800); border-radius: var(--radius-lg); }
.shimmer {
  background: linear-gradient(90deg, var(--carbon-700) 25%, var(--carbon-600) 50%, var(--carbon-700) 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 4rem 2rem; color: var(--carbon-500); text-align: center;
}
.empty-state i { font-size: 2.5rem; color: var(--carbon-600); }
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--carbon-400); }
.empty-state span { font-size: 0.85rem; }
</style>
