<template>
  <div class="subscriptions-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Planes y Suscripcion</h1>
        <p class="page-sub">Consulta el plan Premium y el estado de tu suscripcion.</p>
      </div>
      <button class="refresh-btn" type="button" @click="load">
        <i class="pi pi-refresh"></i>
        Actualizar
      </button>
    </div>

    <section class="active-card">
      <div>
        <span class="eyebrow">Suscripcion activa</span>
        <h2>{{ activeSubscription ? activeSubscription.status : 'Sin suscripcion activa' }}</h2>
        <p v-if="activeSubscription">Plan #{{ activeSubscription.fkIdPlan }} · Usuario #{{ activeSubscription.fkIdUser }}</p>
        <p v-else>Activa el plan Premium para habilitar tu cuenta.</p>
      </div>
      <span v-if="activeSubscription" class="active-pill">{{ activeSubscription.autoRenew ? 'Auto-renovable' : 'Manual' }}</span>
    </section>

    <div v-if="loading" class="state-card">Cargando planes...</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>

    <section v-else class="plans-grid">
      <article v-for="plan in plans" :key="plan.id" class="plan-card" :class="{ premium: plan.planType === 'Premium' }">
        <div class="plan-head">
          <div>
            <h3>{{ plan.name }}</h3>
            <p>{{ plan.planType }} · {{ plan.targetRole }}</p>
          </div>
          <span class="plan-state">{{ plan.isActive ? 'Activo' : 'Inactivo' }}</span>
        </div>
        <div class="price">{{ plan.currency }} {{ formatMoney(plan.price) }}</div>
        <p class="benefits">{{ plan.benefits || 'Beneficios del plan disponibles desde el backend.' }}</p>
        <div class="quota">
          <i class="pi pi-compass"></i>
          {{ plan.discoveryQuota == null ? 'Discovery ilimitado' : `${plan.discoveryQuota} usos Discovery` }}
        </div>
        <button class="subscribe-btn" type="button" :disabled="!plan.isActive || subscribingId === plan.id" @click="subscribe(plan)">
          <span v-if="subscribingId === plan.id" class="spinner"></span>
          {{ subscribingId === plan.id ? 'Procesando...' : 'Suscribirme' }}
        </button>
      </article>
    </section>

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
import { onMounted, ref } from 'vue'
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

onMounted(load)
</script>

<style scoped>
.subscriptions-page { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.page-title { color: var(--carbon-50); font-size: 1.5rem; font-weight: 700; }
.page-sub { color: var(--carbon-400); font-size: 0.875rem; margin-top: 4px; }
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
.state-card { min-height: 140px; background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: var(--carbon-400); }
.state-card.error { color: var(--danger); border-color: rgba(248,113,113,0.3); }
.plans-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.plan-card { background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.plan-card.premium { border-color: rgba(201,168,76,0.55); }
.plan-head { display: flex; justify-content: space-between; gap: 1rem; }
.plan-head h3 { color: var(--carbon-100); font-size: 1.1rem; }
.plan-head p { color: var(--carbon-400); font-size: 0.8rem; margin-top: 2px; }
.plan-state { color: var(--success); font-size: 12px; font-weight: 700; }
.price { color: var(--gold-400); font-size: 2rem; font-weight: 700; }
.benefits { color: var(--carbon-300); font-size: 0.9rem; min-height: 44px; }
.quota { display: flex; align-items: center; gap: 8px; color: var(--carbon-400); font-size: 0.85rem; }
.quota i { color: var(--gold-500); }
.subscribe-btn { width: 100%; border: none; background: var(--gradient-gold); color: var(--carbon-950); padding: 10px 14px; font-weight: 700; }
.subscribe-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.history-section { display: flex; flex-direction: column; gap: 0.75rem; }
.history-section h2 { color: var(--carbon-200); font-size: 1.1rem; }
.history-empty, .history-row { background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-md); padding: 0.9rem 1rem; color: var(--carbon-400); }
.history-list { display: flex; flex-direction: column; gap: 0.5rem; }
.history-row { display: grid; grid-template-columns: 80px 1fr 1fr; gap: 1rem; align-items: center; }
.history-row strong { color: var(--carbon-100); }
.spinner { width: 14px; height: 14px; border: 2px solid var(--carbon-950); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) { .plans-grid { grid-template-columns: 1fr; } .page-header, .active-card { flex-direction: column; } .history-row { grid-template-columns: 1fr; } }
</style>
