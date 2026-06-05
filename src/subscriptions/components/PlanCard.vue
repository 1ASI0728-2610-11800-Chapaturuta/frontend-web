<template>
  <div class="plan-card" :class="{ featured: plan.planType === 'Premium', current: isCurrent }">
    <div v-if="plan.planType === 'Premium'" class="popular-badge">Premium</div>
    <span v-if="isCurrent" class="current-badge">Tu plan</span>

    <h3 class="plan-name">{{ plan.name }}</h3>

    <div class="plan-price">
      <span class="price-amount">{{ plan.formattedPrice }}</span>
      <span v-if="!plan.isFree" class="price-period">{{ plan.billingLabel }}</span>
    </div>

    <p class="plan-meta">
      <i class="pi pi-sparkles"></i>
      {{ plan.isUnlimitedDiscovery ? 'Discovery ilimitado' : `${plan.discoveryQuota} consultas Discovery / ciclo` }}
    </p>

    <ul v-if="plan.benefitList.length" class="plan-features">
      <li v-for="(feature, idx) in plan.benefitList" :key="idx">
        <i class="pi pi-check"></i>
        {{ feature }}
      </li>
    </ul>
    <p v-else class="plan-benefits-text">{{ plan.benefits }}</p>

    <pb-Button
        class="plan-btn"
        :class="{ 'plan-btn-accent': plan.planType === 'Premium' }"
        :label="ctaLabel"
        :disabled="disabled || isCurrent"
        :loading="loading"
        @click="$emit('select', plan)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Plan } from '@/subscriptions/models/plan.entity.js';

const props = defineProps({
  plan: { type: [Object, Plan], required: true },
  isCurrent: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
});

defineEmits(['select']);

const ctaLabel = computed(() => {
  if (props.isCurrent) return 'Plan actual';
  return props.plan.isFree ? 'Empezar gratis' : 'Suscribirme';
});
</script>

<style scoped>
.plan-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: var(--shadow-card);
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease, transform var(--duration-fast) ease;
}
.plan-card:hover {
  border-color: var(--gold-500);
  box-shadow: var(--shadow-elevated);
  transform: translateY(-2px);
}
.plan-card.featured {
  border-color: var(--gold-500);
  box-shadow: var(--shadow-elevated);
}
.plan-card.current {
  border-color: var(--success);
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-gold);
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.current-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(59, 174, 110, 0.12);
  color: var(--success);
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.plan-name { font-size: 1.15rem; font-weight: 700; color: var(--carbon-100); }

.plan-price { display: flex; align-items: baseline; gap: 6px; }
.price-amount { font-size: 1.9rem; font-weight: 700; color: var(--gold-600); letter-spacing: -0.03em; }
.price-period { font-size: 0.85rem; color: var(--carbon-400); }

.plan-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--carbon-400);
}
.plan-meta i { color: var(--gold-600); font-size: 12px; }

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.plan-features li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--carbon-300);
  line-height: 1.4;
}
.plan-features li i { color: var(--gold-600); font-size: 11px; margin-top: 3px; }

.plan-benefits-text {
  font-size: 0.85rem;
  color: var(--carbon-300);
  flex: 1;
  line-height: 1.4;
}

.plan-btn { margin-top: 0.5rem; }
:deep(.plan-btn.p-button) {
  width: 100%;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--carbon-600);
  color: var(--carbon-300);
  font-weight: 600;
}
:deep(.plan-btn.p-button:not(:disabled):hover) {
  border-color: var(--gold-500);
  color: var(--gold-600);
  background: var(--gold-100);
}
:deep(.plan-btn-accent.p-button) {
  background: var(--gradient-gold);
  border: none;
  color: var(--ink);
}
:deep(.plan-btn-accent.p-button:not(:disabled):hover) {
  opacity: 0.9;
  color: var(--ink);
}
</style>
