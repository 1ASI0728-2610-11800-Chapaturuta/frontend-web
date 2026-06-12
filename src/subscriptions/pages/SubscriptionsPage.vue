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
        <h2>{{ activeSubscription ? activeSubscription.status : 'Plan Basico (Gratis)' }}</h2>
        <p v-if="activeSubscription">Plan #{{ activeSubscription.fkIdPlan }} · Usuario #{{ activeSubscription.fkIdUser }}</p>
        <p v-else>Estas en el plan gratuito. Pasa a Premium para desbloquear todo.</p>
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
          <ul class="feature-list">
            <li v-for="(f, i) in features.premium.items" :key="i" class="highlight">
              <i class="pi pi-check-circle"></i><span v-html="f"></span>
            </li>
          </ul>
          <button
            class="subscribe-btn"
            type="button"
            :disabled="!premiumPlan || !premiumPlan.isActive || subscribingId === premiumPlan?.id"
            @click="premiumPlan && subscribe(premiumPlan)"
          >
            <span v-if="subscribingId === premiumPlan?.id" class="spinner"></span>
            <i v-else class="pi pi-bolt"></i>
            {{ subscribingId === premiumPlan?.id ? 'Procesando...' : 'Pasar a Premium' }}
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
          <strong>{{ sub.status }}</strong>
          <span>Plan #{{ sub.fkIdPlan }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { PlanService, SubscriptionService } from '@/subscriptions/services/subscription.service.js'
import { getCurrentUser, getUserId } from '@/shared/services/session.service.js'

const planService = new PlanService()
const subscriptionService = new SubscriptionService()
const plans = ref([])
const history = ref([])
const activeSubscription = ref(null)
const loading = ref(false)
const error = ref('')
const subscribingId = ref(null)
const processing = ref(false)

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

async function subscribe(plan) {
  const userId = getUserId()
  if (!userId) return
  subscribingId.value = plan.id
  error.value = ''
  try {
    await subscriptionService.subscribeToPlan({
      fkIdUser: userId,
      fkIdPlan: plan.id,
      autoRenew: true,
      paymentMethod: 3
    })
    await load()
  } catch (err) {
    error.value = err?.data?.message || err?.message || 'No se pudo crear la suscripcion'
  } finally {
    subscribingId.value = null
  }
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
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) {
  .plans-grid { grid-template-columns: 1fr; }
  .page-header, .active-card { flex-direction: column; }
  .history-row { grid-template-columns: 1fr; }
  .compare-row { grid-template-columns: 1.6fr 1fr 1fr; }
}
</style>
