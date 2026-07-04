<template>
  <div class="assistant-page">
    <div class="assistant-header">
      <div>
        <h1 class="title"><i class="pi pi-sparkles"></i> Asistente <span class="gold">IA</span></h1>
        <p class="sub">Arma viajes con conexiones y responde tus dudas sobre rutas, paraderos, precios y horarios.</p>
      </div>
      <span v-if="ASSISTANT_ENABLED" class="premium-badge"><i class="pi pi-crown"></i> Premium</span>
      <span v-else class="soon-badge"><i class="pi pi-clock"></i> Próximamente</span>
    </div>

    <!-- Mock-up "Próximamente" (feature en evaluación, aún no utilizable) -->
    <div v-if="!ASSISTANT_ENABLED" class="coming-soon">
      <div class="cs-icon"><i class="pi pi-sparkles"></i></div>
      <h2>Asistente IA — en desarrollo</h2>
      <p>
        Estamos definiendo el modelo de IA y su enfoque para darte los mejores itinerarios.
        Esta función de <strong>pasajero Premium</strong> estará disponible pronto.
      </p>
      <ul class="cs-list">
        <li><i class="pi pi-check-circle"></i> Rutas con transbordos hacia destinos sin ruta directa</li>
        <li><i class="pi pi-check-circle"></i> Conversación en lenguaje natural</li>
        <li><i class="pi pi-check-circle"></i> ETA real por tramo y reserva directa</li>
      </ul>

      <!-- Vista previa deshabilitada -->
      <div class="cs-preview" aria-hidden="true">
        <div class="msg user"><div class="bubble">¿cómo llego de Surco a Comas?</div></div>
        <div class="msg assistant"><div class="bubble">Pronto podré armarte un itinerario con conexiones…</div></div>
      </div>
      <div class="cs-input">
        <input type="text" placeholder="Disponible próximamente…" disabled />
        <button disabled><i class="pi pi-send"></i></button>
      </div>
    </div>

    <!-- No premium: teaser -->
    <div v-else-if="premiumLoaded && !isPremium" class="upsell-card">
      <div class="lock-circle"><i class="pi pi-lock"></i></div>
      <h2>Función exclusiva Premium</h2>
      <p>El Asistente IA de viajes (rutas con transbordos hacia destinos sin ruta directa) está disponible solo con el <strong>plan Premium activo</strong>.</p>
      <router-link to="/driver/subscriptions" class="upsell-btn"><i class="pi pi-bolt"></i> Ver planes Premium</router-link>
    </div>

    <!-- Premium: chat -->
    <template v-else-if="isPremium">
      <div class="chat-window" ref="chatRef">
        <div v-if="messages.length === 0" class="chat-empty">
          <i class="pi pi-comments"></i>
          <p>Pregúntame un viaje: <em>"¿cómo llego de Surco a Comas?"</em></p>
          <p>O sobre la red: <em>"¿cuánto cuesta la ruta a Comas?"</em>, <em>"¿qué paraderos hay en Surco?"</em></p>
        </div>

        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          <div class="bubble">
            <p v-if="m.text" class="bubble-text">{{ m.text }}</p>

            <!-- Itinerarios -->
            <div v-if="m.itineraries && m.itineraries.length" class="itineraries">
              <div v-for="(it, idx) in m.itineraries" :key="idx" class="itinerary">
                <div class="it-head">
                  <span><i class="pi pi-directions"></i> {{ legCount(it) }} tramo(s) · {{ it.transfers }} transbordo(s)</span>
                  <span class="it-totals">
                    S/ {{ Number(it.totalPrice || 0).toFixed(2) }}
                    <template v-if="it.totalEtaSeconds"> · ~{{ etaMin(it.totalEtaSeconds) }} min</template>
                  </span>
                </div>

                <div v-for="(seg, si) in it.segments" :key="si" class="seg" :class="seg.kind">
                  <i :class="seg.kind === 'ride' ? 'pi pi-car' : 'pi pi-directions-alt'"></i>
                  <div class="seg-body" v-if="seg.kind === 'ride'">
                    <strong>Sube en {{ seg.from.name }} → baja en {{ seg.to.name }}</strong>
                    <span>S/ {{ Number(seg.price || 0).toFixed(2) }}<template v-if="seg.etaSeconds"> · ~{{ etaMin(seg.etaSeconds) }} min</template></span>
                  </div>
                  <div class="seg-body" v-else>
                    <strong>Camina ~{{ Math.round(seg.meters || 0) }} m</strong>
                    <span>hasta {{ seg.to.name }}</span>
                  </div>
                  <button v-if="seg.kind === 'ride'" class="seg-reserve" @click="openReserve(seg)">Reservar</button>
                </div>

                <div class="it-actions">
                  <button class="ghost" @click="saveItinerary(it)"><i class="pi pi-bookmark"></i> Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="sending" class="msg assistant">
          <div class="bubble typing"><span></span><span></span><span></span></div>
        </div>
      </div>

      <form class="chat-input" @submit.prevent="send">
        <input v-model="input" type="text" placeholder="¿A dónde quieres ir? Ej: de Miraflores a San Juan de Lurigancho" :disabled="sending" />
        <button type="submit" :disabled="sending || !input.trim()"><i class="pi pi-send"></i></button>
      </form>
    </template>

    <!-- Mini-dialog reserva del tramo -->
    <pb-Dialog v-model:visible="showReserve" modal header="Reservar tramo" :style="{ width: '24rem' }">
      <div v-if="reserveSeg" class="reserve-body">
        <p class="reserve-route">{{ reserveSeg.from.name }} → {{ reserveSeg.to.name }}</p>

        <!-- Solo se puede reservar un viaje YA PUBLICADO por un conductor (mismo
             principio que las reservas normales). Sin viajes publicados no hay reserva. -->
        <label>Viaje publicado</label>
        <div v-if="loadingJoinable" class="reserve-hint">Buscando viajes publicados…</div>
        <div v-else-if="!joinableTrips.length" class="reserve-empty">
          Ningún conductor ha publicado un viaje para esta ruta todavía. No puedes reservar aún.
        </div>
        <select v-else v-model.number="selectedTripId" class="reserve-input">
          <option v-for="t in joinableTrips" :key="t.id" :value="t.id">{{ tripOptionLabel(t) }}</option>
        </select>

        <template v-if="joinableTrips.length">
          <label>Asientos</label>
          <input v-model.number="reserveSeats" type="number" min="1" :max="maxSeats || 1" class="reserve-input" />
          <small v-if="seatsError" class="field-error">{{ seatsError }}</small>
          <label>Documento (DNI)</label>
          <input v-model="reserveDni" type="text" inputmode="numeric" maxlength="8" class="reserve-input" placeholder="12345678" />
          <small v-if="dniError" class="field-error">{{ dniError }}</small>
        </template>
      </div>
      <template #footer>
        <pb-Button label="Cancelar" text @click="showReserve = false" />
        <pb-Button label="Continuar al pago" icon="pi pi-arrow-right" :disabled="!selectedTrip || !!seatsError || !!dniError" @click="goToCheckout" />
      </template>
    </pb-Dialog>

    <!-- Guardar itinerario en una colección -->
    <pb-Dialog v-model:visible="showCollectionPicker" modal header="Guardar en colección" :style="{ width: '24rem' }">
      <div class="collection-body">
        <div v-if="!collections.length" class="reserve-empty">
          Aún no tienes colecciones. Crea una desde la sección Colecciones y vuelve a intentarlo.
        </div>
        <template v-else>
          <label>Elige una colección</label>
          <select v-model.number="selectedCollectionId" class="reserve-input">
            <option v-for="c in collections" :key="c.id" :value="c.id">{{ c.name || `Colección #${c.id}` }}</option>
          </select>
          <p class="collection-hint">Se guardarán las rutas de este itinerario en la colección elegida.</p>
        </template>
      </div>
      <template #footer>
        <pb-Button label="Cancelar" text @click="showCollectionPicker = false" />
        <pb-Button label="Guardar" icon="pi pi-bookmark"
          :disabled="!collections.length || selectedCollectionId == null" :loading="savingCollection"
          @click="confirmSaveToCollection" />
      </template>
    </pb-Dialog>

    <PaymentCheckoutDialog
      v-model="showCheckout"
      title="Pagar tramo"
      :amount="checkoutAmount"
      success-message="Tu reserva fue pagada y confirmada."
      :pay-provider="legPayProvider"
      @paid="onLegPaid"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { usePremiumStatus } from '@/shared/composables/usePremiumStatus.js'
import { AssistantService } from '@/discovery/services/assistant.service.js'
import { TripService } from '@/trips/services/trip.service.js'
import { ReservationService } from '@/reservations/services/reservation.service.js'
import { CollectionService } from '@/collections/services/collection.service.js'
import PaymentCheckoutDialog from '@/payments/components/payment-checkout-dialog.component.vue'
import { getUserId } from '@/shared/services/session.service.js'
import { dni as dniRule, integerMin } from '@/shared/validation/validators.js'

// Feature flag: alineado con "Assistant:Enabled" del backend.
// En false muestra el mock-up "Próximamente"; en true habilita el chat (Premium).
const ASSISTANT_ENABLED = true

const { isPremium, loaded: premiumLoaded } = usePremiumStatus()
const toast = useToast()
const service = new AssistantService()

const messages = ref([])
const input = ref('')
const sending = ref(false)
const chatRef = ref(null)

const legCount = (it) => it.segments.filter(s => s.kind === 'ride').length
const etaMin = (sec) => Math.max(1, Math.round((sec || 0) / 60))

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  messages.value.push({ role: 'user', text })
  input.value = ''
  sending.value = true
  await scrollDown()
  try {
    const res = await service.ask(text)
    messages.value.push({ role: 'assistant', text: res?.reply || '', itineraries: res?.itineraries || [] })
  } catch (err) {
    messages.value.push({ role: 'assistant', text: err?.friendlyMessage || 'No pude procesar tu consulta.' })
  } finally {
    sending.value = false
    await scrollDown()
  }
}

async function scrollDown() {
  await nextTick()
  if (chatRef.value) chatRef.value.scrollTop = chatRef.value.scrollHeight
}

// ── Guardar itinerario en una colección ──────────────────────────────────────
// Un itinerario son varios tramos "ride", cada uno con su routeId. Guardarlo =
// agregar esas rutas (únicas) a la colección que elija el usuario.
const collectionService = new CollectionService()
const showCollectionPicker = ref(false)
const collections = ref([])
const selectedCollectionId = ref(null)
const savingCollection = ref(false)
const itineraryToSave = ref(null)

async function saveItinerary(it) {
  itineraryToSave.value = it
  selectedCollectionId.value = null
  collections.value = []
  showCollectionPicker.value = true
  try {
    collections.value = await collectionService.getCollectionsByUserId(getUserId())
    if (collections.value.length) selectedCollectionId.value = collections.value[0].id
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.friendlyMessage || 'No se pudieron cargar las colecciones.', life: 4000 })
  }
}

async function confirmSaveToCollection() {
  if (selectedCollectionId.value == null) {
    toast.add({ severity: 'warn', summary: 'Elige una colección', detail: 'Selecciona una colección para guardar.', life: 3000 })
    return
  }
  const routeIds = [...new Set((itineraryToSave.value?.segments || [])
    .filter(s => s.kind === 'ride' && s.routeId != null)
    .map(s => s.routeId))]
  if (!routeIds.length) {
    toast.add({ severity: 'warn', summary: 'Nada que guardar', detail: 'Este itinerario no tiene rutas.', life: 3000 })
    return
  }
  savingCollection.value = true
  try {
    await Promise.all(routeIds.map(id => collectionService.addRouteToCollection(selectedCollectionId.value, id)))
    toast.add({ severity: 'success', summary: 'Guardado', detail: `Se agregaron ${routeIds.length} ruta(s) a la colección.`, life: 3000 })
    showCollectionPicker.value = false
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err?.friendlyMessage || err?.data?.message || 'No se pudo guardar en la colección.', life: 4000 })
  } finally {
    savingCollection.value = false
  }
}

// ── Reserva de un tramo ──────────────────────────────────────────────────────
// Mismo principio que las reservas normales (route-complete-details): solo se
// reserva un viaje YA PUBLICADO por un conductor y con asientos libres. NO se
// fabrica un viaje. El backend descuenta asientos contra la capacidad real del
// viaje elegido, así que no se puede reservar sin viaje publicado ni de más.
const tripService = new TripService()
const reservationService = new ReservationService()

const showReserve = ref(false)
const reserveSeg = ref(null)
const reserveSeats = ref(1)
const reserveDni = ref('')
const showCheckout = ref(false)
const checkoutAmount = ref(0)
const joinableTrips = ref([])
const loadingJoinable = ref(false)
const selectedTripId = ref(null)

const selectedTrip = computed(() => joinableTrips.value.find(t => t.id === selectedTripId.value) || null)
const maxSeats = computed(() => selectedTrip.value?.availableSeats ?? 0)
const seatsError = computed(() => {
  const base = integerMin(reserveSeats.value, 1, 'Los asientos')
  if (base) return base
  if (selectedTrip.value && Number(reserveSeats.value) > maxSeats.value)
    return `Solo quedan ${maxSeats.value} asiento(s) en este viaje.`
  return null
})
const dniError = computed(() => dniRule(reserveDni.value))

function tripOptionLabel(t) {
  const seats = t.availableSeats ?? 0
  const price = Number(t.price ?? reserveSeg.value?.price ?? 0).toFixed(2)
  const when = t.startTime ? new Date(t.startTime).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  return `${when ? when + ' · ' : ''}${seats} asiento(s) · S/ ${price}`
}

async function openReserve(seg) {
  reserveSeg.value = seg
  reserveSeats.value = 1
  reserveDni.value = ''
  selectedTripId.value = null
  joinableTrips.value = []
  showReserve.value = true
  await loadJoinableTrips(seg)
}

// Viajes publicados por conductores para la ruta de este tramo (con asientos libres).
async function loadJoinableTrips(seg) {
  if (!seg?.routeId) return
  loadingJoinable.value = true
  try {
    joinableTrips.value = await tripService.getJoinableTrips(seg.routeId)
    if (joinableTrips.value.length) selectedTripId.value = joinableTrips.value[0].id
  } catch {
    joinableTrips.value = []
  } finally {
    loadingJoinable.value = false
  }
}

function goToCheckout() {
  if (!selectedTrip.value) {
    toast.add({ severity: 'warn', summary: 'Elige un viaje', detail: 'No hay un viaje publicado para reservar en esta ruta.', life: 3500 })
    return
  }
  if (seatsError.value || dniError.value) return
  const unitPrice = Number(selectedTrip.value.price ?? reserveSeg.value.price ?? 0)
  checkoutAmount.value = unitPrice * Number(reserveSeats.value || 1)
  showReserve.value = false
  showCheckout.value = true
}

// Se une al viaje publicado elegido (el backend descuenta sus asientos reales).
async function legPayProvider(method) {
  const reservation = await reservationService.createReservation({
    fkIdUser: getUserId(),
    fkIdTrip: selectedTrip.value.id,
    documentType: 'Dni',
    documentNumber: reserveDni.value,
    seats: reserveSeats.value,
    paymentMethod: method
  })
  return reservation?.fkIdPayment
}

function onLegPaid() {
  toast.add({ severity: 'success', summary: 'Tramo reservado', detail: 'Tu reserva fue pagada y confirmada.', life: 3000 })
}
</script>

<style scoped>
.assistant-page { display: flex; flex-direction: column; gap: 1.25rem; max-width: 860px; margin: 0 auto; height: calc(100vh - 120px); }
.assistant-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.title { font-size: 1.6rem; font-weight: 700; color: var(--carbon-50); }
.title .gold { color: var(--gold-400); }
.title i { color: var(--gold-400); }
.sub { color: var(--carbon-400); margin-top: 4px; font-size: 0.88rem; }
.premium-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--gradient-gold); color: var(--carbon-950); font-weight: 800; font-size: 0.8rem; padding: 6px 14px; border-radius: 999px; }
.soon-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(96,165,250,0.15); color: #93c5fd; border: 1px solid rgba(96,165,250,0.35); font-weight: 700; font-size: 0.8rem; padding: 6px 14px; border-radius: 999px; }

/* Coming soon */
.coming-soon { background: linear-gradient(180deg, rgba(96,165,250,0.06), var(--carbon-800) 60%); border: 1px solid var(--carbon-700); border-radius: var(--radius-xl); padding: 2.25rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.85rem; text-align: center; }
.cs-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(139,92,246,0.12); display: flex; align-items: center; justify-content: center; color: var(--gold-400); font-size: 30px; }
.coming-soon h2 { color: var(--carbon-50); font-size: 1.4rem; font-weight: 800; }
.coming-soon p { color: var(--carbon-400); max-width: 560px; font-size: 0.92rem; line-height: 1.5; }
.coming-soon p strong { color: var(--gold-300); }
.cs-list { list-style: none; display: flex; flex-direction: column; gap: 8px; text-align: left; margin: 0.25rem 0; }
.cs-list li { display: flex; align-items: center; gap: 9px; color: var(--carbon-200); font-size: 0.9rem; }
.cs-list i { color: var(--gold-400); }
.cs-preview { width: 100%; max-width: 520px; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 8px; opacity: 0.55; filter: grayscale(0.3); pointer-events: none; }
.cs-input { width: 100%; max-width: 520px; display: flex; gap: 8px; opacity: 0.6; }
.cs-input input { flex: 1; padding: 11px 14px; background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-md); color: var(--carbon-400); }
.cs-input button { border: none; background: var(--carbon-700); color: var(--carbon-400); border-radius: var(--radius-md); padding: 0 18px; }

/* Upsell */
.upsell-card { background: linear-gradient(180deg, rgba(139,92,246,0.07), var(--carbon-800) 60%); border: 1px solid rgba(139,92,246,0.35); border-radius: var(--radius-xl); padding: 2.5rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.85rem; }
.lock-circle { width: 72px; height: 72px; border-radius: 50%; background: rgba(139,92,246,0.12); display: flex; align-items: center; justify-content: center; color: var(--gold-400); font-size: 32px; }
.upsell-card h2 { color: var(--carbon-50); font-size: 1.4rem; font-weight: 800; }
.upsell-card p { color: var(--carbon-400); max-width: 520px; font-size: 0.92rem; line-height: 1.5; }
.upsell-card p strong { color: var(--gold-300); }
.upsell-btn { margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 8px; background: var(--gradient-gold); color: var(--carbon-950); font-weight: 800; padding: 12px 26px; border-radius: var(--radius-md); text-decoration: none; }

/* Chat */
.chat-window { flex: 1; overflow-y: auto; background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.chat-empty { margin: auto; text-align: center; color: var(--carbon-500); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.chat-empty i { font-size: 2rem; color: var(--carbon-600); }
.chat-empty em { color: var(--gold-300); }
.msg { display: flex; }
.msg.user { justify-content: flex-end; }
.bubble { max-width: 85%; padding: 0.75rem 1rem; border-radius: 14px; }
.msg.user .bubble { background: var(--gradient-gold); color: var(--carbon-950); border-bottom-right-radius: 4px; }
.msg.assistant .bubble { background: var(--carbon-900); border: 1px solid var(--carbon-700); color: var(--carbon-100); border-bottom-left-radius: 4px; }
.bubble-text { font-size: 0.9rem; line-height: 1.45; white-space: pre-wrap; }

.itineraries { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.itinerary { background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-md); padding: 0.75rem; }
.it-head { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--carbon-300); margin-bottom: 8px; flex-wrap: wrap; gap: 6px; }
.it-head i { color: var(--gold-400); }
.it-totals { color: var(--gold-400); font-weight: 700; }
.seg { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid var(--carbon-700); }
.seg:first-of-type { border-top: none; }
.seg > i { color: var(--gold-400); font-size: 15px; }
.seg.walk > i { color: var(--carbon-400); }
.seg-body { flex: 1; display: flex; flex-direction: column; }
.seg-body strong { color: var(--carbon-100); font-size: 0.85rem; }
.seg-body span { color: var(--carbon-400); font-size: 0.76rem; }
.seg-reserve { border: 1px solid rgba(139,92,246,0.4); background: rgba(139,92,246,0.12); color: var(--gold-400); border-radius: 6px; padding: 5px 12px; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
.it-actions { margin-top: 8px; display: flex; justify-content: flex-end; }
.ghost { background: transparent; border: 1px solid var(--carbon-600); color: var(--carbon-300); border-radius: 6px; padding: 5px 12px; font-size: 0.76rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }

.typing { display: inline-flex; gap: 4px; }
.typing span { width: 7px; height: 7px; background: var(--carbon-500); border-radius: 50%; animation: blink 1.2s infinite both; }
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }

.chat-input { display: flex; gap: 8px; }
.chat-input input { flex: 1; padding: 12px 14px; background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-md); color: var(--carbon-100); font-family: var(--font-family); }
.chat-input input:focus { outline: none; border-color: var(--gold-500); }
.chat-input button { border: none; background: var(--gradient-gold); color: var(--carbon-950); border-radius: var(--radius-md); padding: 0 18px; cursor: pointer; font-size: 1rem; }
.chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }

.reserve-body { display: flex; flex-direction: column; gap: 6px; }
.reserve-route { color: var(--carbon-100); font-weight: 600; margin-bottom: 6px; }
.reserve-body label { font-size: 0.8rem; color: var(--carbon-400); }
.reserve-input { padding: 10px 12px; background: var(--carbon-900); border: 1px solid var(--carbon-700); border-radius: 8px; color: var(--carbon-100); }
.reserve-input:focus { outline: none; border-color: var(--gold-500); }
.field-error { color: #e5484d; font-size: 12px; }
.reserve-hint { font-size: 0.8rem; color: var(--carbon-400); padding: 4px 0; }
.reserve-empty { font-size: 0.82rem; color: #e5b84d; background: rgba(229,184,77,0.1); border: 1px solid rgba(229,184,77,0.3); border-radius: 8px; padding: 8px 10px; }
.collection-body { display: flex; flex-direction: column; gap: 8px; }
.collection-body label { font-size: 0.8rem; color: var(--carbon-400); }
.collection-hint { font-size: 0.78rem; color: var(--carbon-400); }
</style>
