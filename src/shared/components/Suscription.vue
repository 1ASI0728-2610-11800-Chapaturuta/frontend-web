<template>
  <div class="subscriptions-section">
    <h2 class="section-title">Elige tu <span class="gold">Plan</span></h2>
    <p class="section-sub">Suscripcion Premium para conductores</p>

    <div class="plans-grid">
      <div class="plan-card featured" v-for="plan in plans" :key="plan.name">
        <div class="popular-badge">Mas Popular</div>
        <h3 class="plan-name">{{ plan.name }}</h3>
        <div class="plan-price">
          <span class="price-amount">{{ plan.price }}</span>
          <span v-if="plan.period" class="price-period">/ {{ plan.period }}</span>
        </div>
        <p class="plan-detail">{{ plan.detail }}</p>
        <ul class="plan-features">
          <li v-for="f in plan.features" :key="f">
            <i class="pi pi-check"></i>
            {{ f }}
          </li>
        </ul>
        <a class="plan-btn plan-btn-gold" href="https://www.sandbox.paypal.com" target="_blank" rel="noopener">
          {{ plan.cta }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SubscriptionsPrototype",
  data() {
    return {
      plans: [
        {
          name: 'Premium',
          price: '$59',
          period: 'ano',
          detail: 'Para operaciones avanzadas.',
          features: ['Conductores ilimitados', 'Rutas avanzadas', 'Soporte prioritario'],
          cta: 'Pagar con PayPal'
        }
      ]
    }
  }
}
</script>

<style scoped>
.subscriptions-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--carbon-50);
}
.section-title .gold { color: var(--gold-400); }
.section-sub { font-size: 0.875rem; color: var(--carbon-400); }

.plans-grid {
  display: grid;
  grid-template-columns: minmax(260px, 420px);
  justify-content: center;
  gap: 1rem;
}
@media (max-width: 700px) { .plans-grid { grid-template-columns: 1fr; } }

.plan-card {
  position: relative;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.plan-card:hover {
  border-color: var(--carbon-600);
  box-shadow: 0 8px 24px rgba(80,60,140,0.12);
}
.plan-card.featured {
  border-color: var(--gold-500);
  box-shadow: 0 4px 24px rgba(139,92,246,0.2);
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-gold);
  color: var(--carbon-950);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 999px;
  white-space: nowrap;
}

.plan-name { font-size: 1.125rem; font-weight: 700; color: var(--carbon-100); }
.plan-price { display: flex; align-items: baseline; gap: 4px; }
.price-amount { font-size: 2rem; font-weight: 700; color: var(--gold-400); }
.price-period { font-size: 0.85rem; color: var(--carbon-400); }
.plan-detail { font-size: 0.85rem; color: var(--carbon-400); }

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.plan-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--carbon-300);
}
.plan-features li i { color: var(--gold-500); font-size: 11px; }

.plan-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid var(--carbon-600);
  color: var(--carbon-300);
  background: transparent;
  transition: all var(--duration-fast) ease;
  margin-top: 0.5rem;
}
.plan-btn-gold {
  background: var(--gradient-gold);
  color: var(--carbon-950);
  border: none;
}
.plan-btn-gold:hover { opacity: 0.88; color: var(--carbon-950); }
</style>
