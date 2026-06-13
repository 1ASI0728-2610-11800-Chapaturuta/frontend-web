<template>
  <div class="subscriptions-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Planes y Suscripcion</h1>
        <p class="page-sub">
          Compara el plan <strong>Basico</strong> con <strong>Premium</strong> y desbloquea
          {{ isDriver ? 'tu dashboard con KPIs e IA' : 'el Discovery sin limites' }}.
        </p>
      </div>
      <button class="refresh-btn" type="button" @click="load">
        <i class="pi pi-refresh"></i>
        Actualizar
      </button>
    </div>

    <!-- Contexto de rol -->
    <div class="role-context" :class="{ driver: isDriver }">
      <i :class="isDriver ? 'pi pi-car' : 'pi pi-compass'"></i>
      <span>Mostrando planes para <strong>{{ isDriver ? 'Conductor' : 'Viajero' }}</strong></span>
    </div>

    <section class="active-card">
      <div>
        <span class="eyebrow">Suscripcion activa</span>
        <h2>
          {{ activeSubscription ? 'Premium' : 'Plan Basico (Gratis)' }}
          <span v-if="activeSubscription" class="status-badge" :class="statusClass(activeSubscription.status)">
            {{ statusLabel(activeSubscription.status) }}
          </span>
        </h2>
        <p v-if="activeSubscription">Plan #{{ activeSubscription.fkIdPlan }} · Usuario #{{ activeSubscription.fkIdUser }}</p>
        <p v-else>Estas en el plan gratuito. Pasa a Premium para desbloquear todo.</p>
        <p v-if="activeSubscription" class="renew-info">
          <i class="pi pi-calendar"></i>
          Pago mensual de <strong>{{ premiumPriceLabel }}</strong> ·
          {{ activeSubscription.autoRenew ? 'Se renueva' : 'Vence' }} el
          <strong>{{ formatDate(activeSubscription.endsAt) }}</strong>
          <span v-if="daysLeft !== null" class="days-left">({{ daysLeftLabel }})</span>
        </p>
      </div>
      <div v-if="activeSubscription" class="active-side">
        <span class="active-pill">{{ activeSubscription.autoRenew ? 'Auto-renovable' : 'Manual' }}</span>
        <div class="active-actions">
          <button class="ghost-action" type="button" :disabled="processing" @click="renew">
            <i class="pi pi-refresh"></i> Renovar
          </button>
          <button class="ghost-action danger" type="button" :disabled="processing" @click="cancel">
            <i class="pi pi-times"></i> Cancelar
          </button>
        </div>
      </div>
    </section>

    <div v-if="loading" class="state-card">Cargando planes...</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>

    <template v-else>
      <!-- Comparativa de cards -->
      <section class="plans-grid">
        <!-- BASICO -->
        <article class="plan-card">
          <div class="plan-head">
            <div>
              <h3>Basico</h3>
              <p>{{ features.basic.tagline }}</p>
            </div>
            <span class="plan-tag current">Tu plan actual</span>
          </div>
          <div class="price">
            <span class="amount">Gratis</span>
            <span class="period">para siempre</span>
          </div>
          <ul class="feature-list">
            <li v-for="(f, i) in features.basic.items" :key="i">
              <i class="pi pi-check"></i><span>{{ f }}</span>
            </li>
            <li v-for="(f, i) in features.basic.locked" :key="'l'+i" class="locked">
              <i class="pi pi-lock"></i><span>{{ f }}</span>
            </li>
          </ul>
          <button class="subscribe-btn ghost" type="button" disabled>Plan actual</button>
        </article>

        <!-- PREMIUM -->
        <article class="plan-card premium">
          <span class="ribbon">Recomendado</span>
          <div class="plan-head">
            <div>
              <h3>Premium</h3>
              <p>{{ features.premium.tagline }}</p>
            </div>
          </div>
          <div class="price">
            <span class="amount">{{ premiumPriceLabel }}</span>
            <span class="period">/ mes</span>
          </div>
          <p class="billing-note">
            <i class="pi pi-sync"></i>
            Facturacion mensual · se cobra cada mes · cancela cuando quieras
          </p>
          <ul class="feature-list">
            <li v-for="(f, i) in features.premium.items" :key="i" class="highlight">
              <i class="pi pi-check-circle"></i><span v-html="f"></span>
            </li>
          </ul>
          <button
            class="subscribe-btn"
            type="button"
            :disabled="!premiumPlan || !premiumPlan.isActive"
            @click="premiumPlan && openCheckout(premiumPlan)"
          >
            <i class="pi pi-bolt"></i>
            Pasar a Premium
          </button>
        </article>
      </section>

      <!-- Tabla comparativa detallada -->
      <section class="compare-section">
        <h2>Comparacion detallada</h2>
        <div class="compare-table">
          <div class="compare-row head">
            <span class="feat">Beneficio</span>
            <span class="col">Basico</span>
            <span class="col premium-col">Premium</span>
          </div>
          <div class="compare-row" v-for="(row, i) in features.matrix" :key="i">
            <span class="feat">{{ row.label }}</span>
            <span class="col">
              <i v-if="row.basic === true" class="pi pi-check cell-ok"></i>
              <i v-else-if="row.basic === false" class="pi pi-minus cell-no"></i>
              <span v-else class="cell-text">{{ row.basic }}</span>
            </span>
            <span class="col premium-col">
              <i v-if="row.premium === true" class="pi pi-check-circle cell-prem"></i>
              <i v-else-if="row.premium === false" class="pi pi-minus cell-no"></i>
              <span v-else class="cell-text strong">{{ row.premium }}</span>
            </span>
          </div>
        </div>
      </section>
    </template>

    <section class="history-section">
      <h2>Historial</h2>
      <div v-if="history.length === 0" class="history-empty">No hay historial de suscripciones.</div>
      <div v-else class="history-list">
        <div v-for="sub in history" :key="sub.id" class="history-row">
          <span>#{{ sub.id }}</span>
          <strong>
            <span class="status-badge" :class="statusClass(sub.status)">{{ statusLabel(sub.status) }}</span>
          </strong>
          <span>Plan #{{ sub.fkIdPlan }}</span>
        </div>
      </div>
    </section>

    <!-- ── Modal de checkout (elegir metodo → pagar → exito) ── -->
    <pb-Dialog
      v-model:visible="showCheckout"
      modal
      :header="checkoutHeader"
      :style="{ width: '30rem' }"
      :closable="checkoutStep !== 'processing'"
      @hide="resetCheckout"
    >
      <!-- Paso 1: elegir metodo -->
      <div v-if="checkoutStep === 'method'" class="method-step">
        <p class="method-intro">
          Elige como quieres pagar tu plan Premium.
        </p>
        <div class="billing-summary">
          <div class="bs-row"><span>Plan</span><strong>Premium mensual</strong></div>
          <div class="bs-row"><span>Cobro hoy</span><strong>{{ premiumPriceLabel }}</strong></div>
          <div class="bs-row"><span>Vence</span><strong>{{ formatDate(nextBillingDate) }}</strong></div>
          <p class="bs-note">Es un pago por <strong>1 mes</strong>. Al vencer pierdes Premium salvo que renueves.</p>
        </div>
        <button class="method-card" type="button" @click="chooseMethod('Card')">
          <i class="pi pi-credit-card"></i>
          <div><strong>Tarjeta</strong><span>Credito o debito vía PayU</span></div>
          <i class="pi pi-chevron-right go"></i>
        </button>
        <button class="method-card" type="button" @click="chooseMethod('Yape')">
          <i class="pi pi-qrcode"></i>
          <div><strong>Yape</strong><span>Escanea un QR con tu app</span></div>
          <i class="pi pi-chevron-right go"></i>
        </button>
        <button class="method-card" type="button" @click="chooseMethod('Plin')">
          <i class="pi pi-qrcode"></i>
          <div><strong>Plin</strong><span>Escanea un QR con tu app</span></div>
          <i class="pi pi-chevron-right go"></i>
        </button>
        <p v-if="checkoutError" class="checkout-error">{{ checkoutError }}</p>
      </div>

      <!-- Paso intermedio: creando la suscripcion/pago -->
      <div v-else-if="checkoutStep === 'processing'" class="processing-step">
        <span class="spinner big"></span>
        <p>Preparando tu pago...</p>
      </div>

      <!-- Paso 2a: tarjeta (PayU) -->
      <div v-else-if="checkoutStep === 'card'">
        <div class="sandbox-hint">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Tarjeta de prueba (sandbox PayU)</strong>
            <span>Nro: 4111 1111 1111 1111 · Venc: 12/29 · CVV: 123 · cualquier email/DNI</span>
          </div>
        </div>
        <PayuCardForm
          :payment-id="paymentId"
          :amount="premiumPrice"
          @paid="onPaid"
          @error="(e) => checkoutError = e"
        />
      </div>

      <!-- Paso 2b: Yape / Plin (QR) -->
      <div v-else-if="checkoutStep === 'qr'">
        <PaymentQr
          :payment-id="paymentId"
          :amount="premiumPrice"
          :method="selectedMethod"
          @paid="onPaid"
          @error="(e) => checkoutError = e"
        />
      </div>

      <!-- Paso 3: exito -->
      <div v-else-if="checkoutStep === 'success'" class="success-step">
        <div class="check-circle"><i class="pi pi-check"></i></div>
        <h3>Pago exitoso!</h3>
        <p>Tu suscripcion Premium ya esta activa.</p>
        <p v-if="activeSubscription" class="success-until">
          Valida hasta el <strong>{{ formatDate(activeSubscription.endsAt) }}</strong> (1 mes).
        </p>
        <button class="primary-btn" type="button" @click="closeCheckout">Listo</button>
      </div>
    </pb-Dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { PlanService, SubscriptionService } from '@/subscriptions/services/subscription.service.js'
import { getCurrentUser, getUserId } from '@/shared/services/session.service.js'
import PayuCardForm from '@/payments/components/payu-card-form.component.vue'
import PaymentQr from '@/payments/components/payment-qr.component.vue'

const planService = new PlanService()
const subscriptionService = new SubscriptionService()
const plans = ref([])
const history = ref([])
const activeSubscription = ref(null)
const loading = ref(false)
const error = ref('')
const processing = ref(false)

// ── Estado del checkout ──────────────────────────────────────────────────────
const PAYMENT_METHOD_ENUM = { Yape: 0, Plin: 1, Card: 2 } // coincide con el enum del backend
const showCheckout = ref(false)
const checkoutStep = ref('method') // method | processing | card | qr | success
const selectedMethod = ref('Card')
const checkoutPlan = ref(null)
const paymentId = ref(null)
const checkoutError = ref('')

const premiumPrice = computed(() => Number(checkoutPlan.value?.price ?? premiumPlan.value?.price ?? 0))
const checkoutHeader = computed(() => {
  if (checkoutStep.value === 'success') return 'Pago confirmado'
  if (checkoutStep.value === 'card') return 'Pago con tarjeta (PayU)'
  if (checkoutStep.value === 'qr') return `Pago con ${selectedMethod.value}`
  return 'Pasar a Premium'
})

const isDriver = computed(() => Number(getCurrentUser()?.role) === 2)
const premiumPlan = computed(() => plans.value[0] || null)
const premiumPriceLabel = computed(() => {
  if (!premiumPlan.value) return 'S/ 19.90'
  const cur = premiumPlan.value.currency || 'S/'
  return `${cur} ${formatMoney(premiumPlan.value.price)}`
})

// ── Contenido de marketing por rol (solo visual) ─────────────────────────────
const TRAVELLER = {
  basic: {
    tagline: 'Tu guia urbana esencial',
    items: [
      'Busqueda de rutas y paraderos',
      'Hasta 10 consultas Discovery al mes',
      'Rutas populares de tu ciudad',
      '1 coleccion de favoritos',
    ],
    locked: [
      'Discovery ilimitado',
      'ETA real y analitica de demanda',
    ],
  },
  premium: {
    tagline: 'Explora la ciudad sin limites',
    items: [
      '<strong>Discovery ILIMITADO</strong> — busca todas las rutas que quieras',
      'Busqueda avanzada origen → destino con <strong>ETA real</strong> (OSRM)',
      'Paraderos cercanos ordenados por <strong>tiempo de viaje real</strong>',
      'Colecciones <strong>ilimitadas</strong> de rutas favoritas',
      'Analitica de demanda y mejores horarios para viajar',
      'Experiencia <strong>sin anuncios</strong> + soporte prioritario',
    ],
  },
  matrix: [
    { label: 'Consultas Discovery', basic: '10 / mes', premium: 'Ilimitado' },
    { label: 'Busqueda con ETA real (OSRM)', basic: false, premium: true },
    { label: 'Paraderos por tiempo de carretera', basic: false, premium: true },
    { label: 'Colecciones de favoritos', basic: '1', premium: 'Ilimitadas' },
    { label: 'Analitica de demanda', basic: false, premium: true },
    { label: 'Sin anuncios', basic: false, premium: true },
    { label: 'Soporte prioritario', basic: false, premium: true },
  ],
}

const DRIVER = {
  basic: {
    tagline: 'Empieza a operar tus rutas',
    items: [
      'Perfil de conductor verificado',
      'Hasta 3 rutas activas',
      'Historial de viajes (ultimos 30 dias)',
      'Calificaciones basicas de pasajeros',
    ],
    locked: [
      'Dashboard con KPIs en tiempo real',
      'Analitica con IA y prediccion de demanda',
    ],
  },
  premium: {
    tagline: 'Maneja tu negocio con datos e IA',
    items: [
      '<strong>Dashboard con KPIs personalizados</strong> en tiempo real',
      'Analitica con <strong>IA</strong>: prediccion de demanda por distrito y horario',
      'Rutas y paraderos <strong>ILIMITADOS</strong>',
      'Resumen de calificaciones y <strong>reputacion destacada</strong>',
      'Insights de rutas populares para <strong>captar mas pasajeros</strong>',
      'Soporte prioritario <strong>24/7</strong>',
    ],
  },
  matrix: [
    { label: 'Rutas activas', basic: '3', premium: 'Ilimitadas' },
    { label: 'Dashboard con KPIs', basic: false, premium: true },
    { label: 'Analitica con IA (demanda)', basic: false, premium: true },
    { label: 'Historial de viajes', basic: '30 dias', premium: 'Completo' },
    { label: 'Insights de rutas populares', basic: false, premium: true },
    { label: 'Resumen de reputacion', basic: false, premium: true },
    { label: 'Soporte prioritario', basic: false, premium: '24/7' },
  ],
}

const features = computed(() => (isDriver.value ? DRIVER : TRAVELLER))

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

// ── Fechas / facturacion mensual ────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return String(value) }
}

// Fecha de vencimiento estimada para el resumen del checkout (hoy + 1 mes).
const nextBillingDate = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d
})

const daysLeft = computed(() => {
  if (!activeSubscription.value?.endsAt) return null
  const end = new Date(activeSubscription.value.endsAt)
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
})
const daysLeftLabel = computed(() => {
  const d = daysLeft.value
  if (d === null) return ''
  if (d < 0) return 'vencida'
  if (d === 0) return 'vence hoy'
  if (d === 1) return 'queda 1 dia'
  return `quedan ${d} dias`
})

async function loadActive(userId) {
  try {
    activeSubscription.value = await subscriptionService.getActiveByUserId(userId)
  } catch {
    activeSubscription.value = null
  }
}

async function load() {
  const user = getCurrentUser()
  const userId = getUserId()
  if (!userId) {
    error.value = 'No hay usuario autenticado.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const targetRole = Number(user.role) === 2 ? 'Driver' : 'Traveller'
    const [availablePlans, subscriptionHistory] = await Promise.all([
      planService.getPlansByTargetRole(targetRole).catch(async () => planService.getAll()),
      subscriptionService.getHistoryByUserId(userId).catch(() => [])
    ])
    plans.value = availablePlans.filter(plan => String(plan.planType || plan.name).toLowerCase().includes('premium'))
    history.value = subscriptionHistory
    await loadActive(userId)
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'No se pudieron cargar las suscripciones'
  } finally {
    loading.value = false
  }
}

// ── Checkout: abrir modal y elegir metodo ──────────────────────────────────
function openCheckout(plan) {
  checkoutPlan.value = plan
  checkoutStep.value = 'method'
  checkoutError.value = ''
  paymentId.value = null
  showCheckout.value = true
}

// Crea la suscripcion (PendingPayment) + el pago, luego muestra el paso de pago.
async function chooseMethod(method) {
  const userId = getUserId()
  if (!userId || !checkoutPlan.value) return
  selectedMethod.value = method
  checkoutStep.value = 'processing'
  checkoutError.value = ''
  try {
    const subscription = await subscriptionService.subscribeToPlan({
      fkIdUser: userId,
      fkIdPlan: checkoutPlan.value.id,
      autoRenew: true,
      paymentMethod: PAYMENT_METHOD_ENUM[method]
    })
    paymentId.value = subscription?.fkIdPayment
    if (!paymentId.value) throw new Error('No se genero el pago de la suscripcion')
    checkoutStep.value = method === 'Card' ? 'card' : 'qr'
  } catch (err) {
    checkoutError.value = err?.data?.message || err?.message || 'No se pudo iniciar el pago'
    checkoutStep.value = 'method'
  }
}

// Pago confirmado (tarjeta, QR escaneado o "simular pago"): refrescar y mostrar exito.
async function onPaid() {
  checkoutStep.value = 'success'
  await load()
}

function closeCheckout() {
  showCheckout.value = false
}

function resetCheckout() {
  checkoutStep.value = 'method'
  paymentId.value = null
  checkoutPlan.value = null
  checkoutError.value = ''
}

// ── Badge de estado de suscripcion ──────────────────────────────────────────
function statusLabel(status) {
  const map = { Active: 'Activo', PendingPayment: 'Pendiente', Cancelled: 'Cancelado', Expired: 'Expirado' }
  return map[status] || status
}
function statusClass(status) {
  const map = { Active: 'ok', PendingPayment: 'pending', Cancelled: 'danger', Expired: 'muted' }
  return map[status] || 'muted'
}

async function cancel() {
  if (!activeSubscription.value) return
  processing.value = true
  error.value = ''
  try {
    await subscriptionService.cancel(activeSubscription.value.id)
    await load()
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'No se pudo cancelar la suscripcion'
  } finally {
    processing.value = false
  }
}

async function renew() {
  if (!activeSubscription.value) return
  processing.value = true
  error.value = ''
  try {
    await subscriptionService.renew(activeSubscription.value.id)
    await load()
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'No se pudo renovar la suscripcion'
  } finally {
    processing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.subscriptions-page { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.page-title { color: var(--carbon-50); font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--carbon-400); font-size: 0.875rem; margin-top: 4px; }
.page-sub strong { color: var(--gold-400); }
.refresh-btn, .subscribe-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-family);
}
.refresh-btn { border: 1px solid rgba(201,168,76,0.3); color: var(--gold-400); background: rgba(201,168,76,0.1); padding: 8px 14px; }

/* ── Contexto de rol ── */
.role-context {
  display: inline-flex; align-items: center; gap: 8px;
  align-self: flex-start;
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.25);
  color: var(--gold-300);
  padding: 6px 12px; border-radius: 999px; font-size: 0.8rem;
}
.role-context.driver { background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.3); color: #93c5fd; }
.role-context strong { color: var(--carbon-50); }

.active-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-left: 4px solid var(--gold-500);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}
.eyebrow { color: var(--gold-400); font-size: 11px; text-transform: uppercase; font-weight: 700; }
.active-card h2 { color: var(--carbon-100); margin-top: 4px; }
.active-card p { color: var(--carbon-400); font-size: 0.875rem; }
.renew-info { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 6px; color: var(--carbon-300) !important; }
.renew-info i { color: var(--gold-400); }
.renew-info strong { color: var(--gold-300); }
.days-left { color: var(--carbon-500); font-size: 0.8rem; }
.billing-note { display: flex; align-items: center; gap: 6px; color: var(--carbon-400); font-size: 0.76rem; margin-top: -4px; }
.billing-note i { color: var(--gold-400); font-size: 13px; }
.active-pill { height: fit-content; padding: 5px 10px; border-radius: 999px; background: rgba(74,222,128,0.12); color: var(--success); font-size: 12px; font-weight: 700; }
.active-side { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.active-actions { display: flex; gap: 8px; }
.ghost-action {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--carbon-600); background: transparent; color: var(--carbon-200);
  border-radius: var(--radius-md); padding: 7px 12px; cursor: pointer; font-weight: 600;
  font-family: var(--font-family); font-size: 0.8rem;
}
.ghost-action:hover:not(:disabled) { border-color: var(--gold-500); color: var(--gold-400); }
.ghost-action:disabled { opacity: 0.5; cursor: not-allowed; }
.ghost-action.danger { color: var(--danger); border-color: rgba(248,113,113,0.4); }
.state-card { min-height: 140px; background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: var(--carbon-400); }
.state-card.error { color: var(--danger); border-color: rgba(248,113,113,0.3); }

/* ── Cards de planes ── */
.plans-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; align-items: stretch; }
.plan-card {
  position: relative;
  background: var(--carbon-800); border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg); padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1.1rem;
}
.plan-card.premium {
  border-color: rgba(201,168,76,0.6);
  background: linear-gradient(180deg, rgba(201,168,76,0.07) 0%, var(--carbon-800) 60%);
  box-shadow: 0 0 0 1px rgba(201,168,76,0.25), 0 14px 40px rgba(201,168,76,0.12);
}
.ribbon {
  position: absolute; top: -11px; right: 18px;
  background: var(--gradient-gold); color: var(--carbon-950);
  font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
  padding: 4px 12px; border-radius: 999px; text-transform: uppercase;
  box-shadow: 0 4px 14px rgba(201,168,76,0.4);
}
.plan-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.plan-head h3 { color: var(--carbon-50); font-size: 1.25rem; font-weight: 700; }
.plan-head p { color: var(--carbon-400); font-size: 0.82rem; margin-top: 3px; }
.plan-tag { font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 999px; }
.plan-tag.current { background: var(--carbon-700); color: var(--carbon-300); }
.price { display: flex; align-items: baseline; gap: 6px; }
.price .amount { color: var(--gold-400); font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
.price .period { color: var(--carbon-400); font-size: 0.85rem; }

.feature-list { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; flex: 1; }
.feature-list li { display: flex; align-items: flex-start; gap: 9px; color: var(--carbon-200); font-size: 0.875rem; line-height: 1.35; }
.feature-list li i { font-size: 14px; margin-top: 2px; color: var(--success); }
.feature-list li.highlight i { color: var(--gold-400); }
.feature-list li.highlight :deep(strong) { color: var(--gold-300); font-weight: 700; }
.feature-list li.locked { color: var(--carbon-500); }
.feature-list li.locked i { color: var(--carbon-500); }

.subscribe-btn { width: 100%; border: none; background: var(--gradient-gold); color: var(--carbon-950); padding: 12px 14px; font-weight: 800; font-size: 0.95rem; margin-top: 0.25rem; }
.subscribe-btn:hover:not(:disabled) { box-shadow: var(--shadow-gold); }
.subscribe-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.subscribe-btn.ghost { background: var(--carbon-700); color: var(--carbon-300); }

/* ── Tabla comparativa ── */
.compare-section { display: flex; flex-direction: column; gap: 0.85rem; }
.compare-section h2 { color: var(--carbon-100); font-size: 1.15rem; font-weight: 700; }
.compare-table {
  border: 1px solid var(--carbon-700); border-radius: var(--radius-lg);
  overflow: hidden; background: var(--carbon-800);
}
.compare-row { display: grid; grid-template-columns: 2fr 1fr 1fr; align-items: center; }
.compare-row .feat { padding: 0.85rem 1.1rem; color: var(--carbon-200); font-size: 0.875rem; }
.compare-row .col { padding: 0.85rem 1rem; text-align: center; font-size: 0.85rem; color: var(--carbon-300); }
.compare-row .premium-col { background: rgba(201,168,76,0.05); }
.compare-row + .compare-row { border-top: 1px solid var(--carbon-700); }
.compare-row.head { background: var(--carbon-900); }
.compare-row.head .feat, .compare-row.head .col { color: var(--carbon-100); font-weight: 700; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; }
.compare-row.head .premium-col { color: var(--gold-400); }
.cell-ok { color: var(--success); font-size: 15px; }
.cell-prem { color: var(--gold-400); font-size: 16px; }
.cell-no { color: var(--carbon-600); font-size: 14px; }
.cell-text { color: var(--carbon-300); }
.cell-text.strong { color: var(--gold-300); font-weight: 700; }

/* ── Historial ── */
.history-section { display: flex; flex-direction: column; gap: 0.75rem; }
.history-section h2 { color: var(--carbon-200); font-size: 1.1rem; }
.history-empty, .history-row { background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-md); padding: 0.9rem 1rem; color: var(--carbon-400); }
.history-list { display: flex; flex-direction: column; gap: 0.5rem; }
.history-row { display: grid; grid-template-columns: 80px 1fr 1fr; gap: 1rem; align-items: center; }
.history-row strong { color: var(--carbon-100); }
.spinner { width: 14px; height: 14px; border: 2px solid var(--carbon-950); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner.big { width: 40px; height: 40px; border-width: 4px; border-color: var(--gold-400); border-top-color: transparent; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Badge de estado ── */
.status-badge { display: inline-block; margin-left: 8px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; vertical-align: middle; }
.status-badge.ok { background: rgba(74,222,128,0.14); color: var(--success); }
.status-badge.pending { background: rgba(201,168,76,0.16); color: var(--gold-400); }
.status-badge.danger { background: rgba(248,113,113,0.14); color: var(--danger); }
.status-badge.muted { background: var(--carbon-700); color: var(--carbon-300); }

/* ── Modal de checkout ── */
.method-intro { color: var(--carbon-300); font-size: 0.9rem; margin-bottom: 0.85rem; }
.method-intro strong { color: var(--gold-400); }
.billing-summary {
  background: var(--carbon-900); border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 1rem;
  display: flex; flex-direction: column; gap: 7px;
}
.bs-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
.bs-row span { color: var(--carbon-400); }
.bs-row strong { color: var(--carbon-100); }
.bs-note { color: var(--carbon-400); font-size: 0.78rem; margin-top: 4px; border-top: 1px solid var(--carbon-700); padding-top: 8px; }
.bs-note strong { color: var(--gold-300); }
.success-until { color: var(--carbon-300); font-size: 0.85rem; }
.success-until strong { color: var(--gold-300); }
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

@media (max-width: 800px) {
  .plans-grid { grid-template-columns: 1fr; }
  .page-header, .active-card { flex-direction: column; }
  .history-row { grid-template-columns: 1fr; }
  .compare-row { grid-template-columns: 1.6fr 1fr 1fr; }
}
</style>
