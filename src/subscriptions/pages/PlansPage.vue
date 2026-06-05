<template>
  <div class="plans-page">
    <header class="page-header">
      <h1 class="page-title">Elige tu <span class="accent">Plan</span></h1>
      <p class="page-sub">Suscripciones para {{ roleLabel }}</p>
    </header>

    <pb-Message v-if="errorMsg" severity="error" :closable="true" @close="errorMsg = ''">
      {{ errorMsg }}
    </pb-Message>
    <pb-Message v-if="successMsg" severity="success" :closable="true" @close="successMsg = ''">
      {{ successMsg }}
    </pb-Message>

    <!-- Suscripcion activa -->
    <section v-if="activeSubscription" class="active-card">
      <div class="active-head">
        <div>
          <span class="active-tag">Suscripción activa</span>
          <h2 class="active-plan-name">{{ activePlanName }}</h2>
        </div>
        <span class="status-pill" :class="statusClass(activeSubscription.status)">
          {{ statusLabel(activeSubscription.status) }}
        </span>
      </div>

      <div class="active-meta">
        <span><i class="pi pi-calendar"></i> Inicio: {{ activeSubscription.startsAtLabel }}</span>
        <span><i class="pi pi-calendar-times"></i> Vence: {{ activeSubscription.endsAtLabel }}</span>
        <span><i class="pi pi-sync"></i> Renovación automática: {{ activeSubscription.autoRenew ? 'Sí' : 'No' }}</span>
      </div>

      <div class="active-actions">
        <pb-Button label="Renovar" icon="pi pi-refresh" outlined :loading="busy" @click="openRenewDialog" />
        <pb-Button label="Cancelar" icon="pi pi-times" severity="danger" outlined :loading="busy" @click="cancelSubscription" />
      </div>
    </section>

    <!-- Catalogo de planes -->
    <section class="plans-grid" v-if="!isLoading">
      <PlanCard
          v-for="plan in plans"
          :key="plan.id"
          :plan="plan"
          :is-current="isCurrentPlan(plan)"
          :loading="busy && selectedPlanId === plan.id"
          :disabled="busy"
          @select="subscribe"
      />
    </section>

    <p v-if="isLoading" class="loading-text">Cargando planes...</p>
    <p v-else-if="!plans.length" class="empty-text">No hay planes disponibles por ahora.</p>

    <!-- Dialogo metodo de pago (suscribir Premium / renovar) -->
    <pb-Dialog v-model:visible="paymentDialog" modal header="Método de pago" :style="{ width: '24rem' }">
      <p class="dialog-text">Selecciona cómo deseas pagar.</p>
      <pb-Select
          v-model="paymentMethod"
          :options="PAYMENT_METHODS"
          placeholder="Método de pago"
          class="dialog-field"
      />
      <template #footer>
        <pb-Button label="Cancelar" text @click="paymentDialog = false" />
        <pb-Button label="Confirmar" :loading="busy" @click="confirmPayment" />
      </template>
    </pb-Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import PlanCard from '@/subscriptions/components/PlanCard.vue';
import { Plan } from '@/subscriptions/models/plan.entity.js';
import { Subscription } from '@/subscriptions/models/subscription.entity.js';
import { PlanService } from '@/subscriptions/services/plan.service.js';
import { SubscriptionService } from '@/subscriptions/services/subscription.service.js';

const PAYMENT_METHODS = ['Yape', 'Plin', 'Card', 'Cash'];
const STATUS_LABELS = {
  Active: 'Activa',
  Expired: 'Expirada',
  Cancelled: 'Cancelada',
  PendingPayment: 'Pago pendiente'
};

const planService = new PlanService();
const subscriptionService = new SubscriptionService();

const plans = ref([]);
const activeSubscription = ref(null);
const isLoading = ref(false);
const busy = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
const selectedPlanId = ref(null);

const paymentDialog = ref(false);
const paymentMethod = ref('Yape');
const pendingAction = ref(null); // { type: 'subscribe' | 'renew', plan?, autoRenew? }

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}');

// Mapeo numero de rol IAM -> TargetRole del backend.
const targetRoleFromUser = computed(() => {
  const role = Number(getUser().role);
  if (role === 2) return 'Driver';      // Driver = 2
  return 'Traveller';                    // Traveller = 0 (por defecto)
});

const roleLabel = computed(() => (targetRoleFromUser.value === 'Driver' ? 'conductores' : 'viajeros'));

const activePlanName = computed(() => {
  if (!activeSubscription.value) return '';
  const plan = plans.value.find(p => p.id === activeSubscription.value.fkIdPlan);
  return plan ? plan.name : `Plan #${activeSubscription.value.fkIdPlan}`;
});

const statusLabel = (status) => STATUS_LABELS[status] || status;
const statusClass = (status) => `status-${(status || '').toLowerCase()}`;

const isCurrentPlan = (plan) =>
    !!activeSubscription.value &&
    activeSubscription.value.fkIdPlan === plan.id &&
    activeSubscription.value.isActive;

const flashError = (msg) => { errorMsg.value = msg; setTimeout(() => { errorMsg.value = ''; }, 4000); };
const flashSuccess = (msg) => { successMsg.value = msg; setTimeout(() => { successMsg.value = ''; }, 4000); };

const loadPlans = async () => {
  isLoading.value = true;
  try {
    const data = await planService.getByTargetRole(targetRoleFromUser.value);
    plans.value = (data || []).map(p => new Plan(p));
  } catch (err) {
    flashError('No se pudieron cargar los planes.');
    console.error('Load plans error:', err);
  } finally {
    isLoading.value = false;
  }
};

const loadActiveSubscription = async () => {
  const userId = getUser().id;
  if (!userId) return;
  try {
    const data = await subscriptionService.getActiveByUser(userId);
    activeSubscription.value = data ? new Subscription(data) : null;
  } catch (err) {
    console.error('Load active subscription error:', err);
  }
};

const subscribe = (plan) => {
  selectedPlanId.value = plan.id;
  if (plan.isFree) {
    pendingAction.value = { type: 'subscribe', plan, autoRenew: false };
    confirmPayment();
    return;
  }
  pendingAction.value = { type: 'subscribe', plan, autoRenew: true };
  paymentDialog.value = true;
};

const openRenewDialog = () => {
  pendingAction.value = { type: 'renew' };
  paymentDialog.value = true;
};

const confirmPayment = async () => {
  const action = pendingAction.value;
  if (!action) return;
  const userId = getUser().id;
  if (!userId) { flashError('Debes iniciar sesión para suscribirte.'); return; }

  busy.value = true;
  try {
    if (action.type === 'subscribe') {
      await subscriptionService.create({
        fkIdUser: userId,
        fkIdPlan: action.plan.id,
        autoRenew: action.autoRenew,
        paymentMethod: action.plan.isFree ? 'Cash' : paymentMethod.value
      });
      flashSuccess('¡Suscripción registrada correctamente!');
    } else if (action.type === 'renew') {
      await subscriptionService.renew(activeSubscription.value.id, { paymentMethod: paymentMethod.value });
      flashSuccess('Suscripción renovada.');
    }
    paymentDialog.value = false;
    await loadActiveSubscription();
  } catch (err) {
    flashError(err?.data?.message || 'No se pudo completar la operación.');
    console.error('Payment/subscribe error:', err);
  } finally {
    busy.value = false;
    selectedPlanId.value = null;
    pendingAction.value = null;
  }
};

const cancelSubscription = async () => {
  if (!activeSubscription.value) return;
  if (!confirm('¿Seguro que deseas cancelar tu suscripción?')) return;
  busy.value = true;
  try {
    await subscriptionService.cancel(activeSubscription.value.id);
    flashSuccess('Suscripción cancelada.');
    await loadActiveSubscription();
  } catch (err) {
    flashError(err?.data?.message || 'No se pudo cancelar la suscripción.');
    console.error('Cancel error:', err);
  } finally {
    busy.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadPlans(), loadActiveSubscription()]);
});
</script>

<style scoped>
.plans-page { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header { display: flex; flex-direction: column; gap: 4px; }
.page-title { font-size: 1.6rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.02em; }
.page-title .accent { color: var(--gold-600); }
.page-sub { font-size: 0.9rem; color: var(--carbon-400); }

.active-card {
  background: var(--gradient-card);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.active-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.active-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--gold-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.active-plan-name { font-size: 1.25rem; font-weight: 700; color: var(--carbon-100); margin-top: 2px; }

.status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.status-active { background: rgba(59,174,110,0.12); color: var(--success); }
.status-pendingpayment { background: rgba(224,169,46,0.14); color: var(--warning); }
.status-cancelled { background: rgba(226,86,107,0.12); color: var(--danger); }
.status-expired { background: var(--carbon-700); color: var(--carbon-400); }

.active-meta { display: flex; flex-wrap: wrap; gap: 1.25rem; font-size: 0.85rem; color: var(--carbon-400); }
.active-meta i { color: var(--gold-600); margin-right: 6px; }

.active-actions { display: flex; gap: 12px; flex-wrap: wrap; }

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.loading-text, .empty-text { color: var(--carbon-400); font-size: 0.9rem; text-align: center; padding: 2rem 0; }

.dialog-text { font-size: 0.9rem; color: var(--carbon-300); margin-bottom: 1rem; }
.dialog-field { width: 100%; }
</style>
