<script>
/**
 * Banner de cuota agotada con CTA de upsell a planes Premium.
 *
 * TODO(owner): ajustar las rutas destino del CTA. Por ahora apuntan a
 *   `/traveller/plans` (viajero) y `/conductor/suscription` (conductor).
 *   El owner del ruteo decide la ruta final y/o el rol activo.
 */
export default {
  name: 'quota-upsell-banner',
  props: {
    message: {
      type: String,
      default: 'Plan Free agotado para Discovery. Suscríbase a Premium para uso ilimitado.'
    },
    // Ruta destino del CTA. TODO(owner): confirmar ruta de planes.
    plansRoute: {
      type: String,
      default: '/traveller/plans'
    }
  }
}
</script>

<template>
  <div class="quota-banner" role="alert">
    <i class="pi pi-lock quota-icon"></i>
    <div class="quota-text">
      <strong class="quota-title">Has alcanzado el límite de tu Plan Free</strong>
      <span class="quota-desc">{{ message }}</span>
    </div>
    <router-link :to="plansRoute" class="quota-cta">
      <i class="pi pi-star"></i>
      Ver planes Premium
    </router-link>
  </div>
</template>

<style scoped>
.quota-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  background: var(--lilac-100);
  border: 1px solid var(--gold-500);
  border-left: 4px solid var(--gold-600);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.quota-icon {
  font-size: 1.5rem;
  color: var(--gold-600);
}
.quota-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 220px;
}
.quota-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ink);
}
.quota-desc {
  font-size: 0.82rem;
  color: var(--carbon-400);
}
.quota-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--gold-500);
  color: var(--ink);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--duration-fast) ease, transform var(--duration-fast) ease;
}
.quota-cta:hover {
  background: var(--gold-400);
  transform: translateY(-1px);
}
</style>
