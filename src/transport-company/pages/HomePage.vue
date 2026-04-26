<script setup>
import KPICard from "@/transport-company/components/KPICard.vue";
import CompanyInfoCard from "@/transport-company/components/CompanyEditCard.vue";
import SubscriptionsPrototype from "@/shared/components/Suscription.vue";
import { CurrencyDollarIcon, MapPinIcon, StopCircleIcon, ClockIcon } from "@heroicons/vue/24/solid/index.js";
import { ref, onMounted } from 'vue'
import { TransportCompanyService } from '@/transport-company/services/transport-company.service.js'

const companyName = ref('tu empresa')
const totalStops  = ref('—')
const totalRoutes = ref('—')

onMounted(async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.username) companyName.value = user.username
    const svc = new TransportCompanyService()
    if (user.companyId) {
      const company = await svc.getCompanyById(user.companyId)
      if (company?.name) companyName.value = company.name
    }
  } catch { /* non-critical */ }
})
</script>

<template>
  <div class="home-page">

    <div class="welcome-section">
      <div>
        <h1 class="welcome-title">¡Bienvenido, <span class="gold">{{ companyName }}</span>!</h1>
        <p class="welcome-sub">Panel de gestión de tu empresa de transporte urbano.</p>
      </div>
      <div class="welcome-badge">
        <i class="pi pi-building"></i>
        Panel Empresa
      </div>
    </div>

    <section class="section">
      <h2 class="section-title">Resumen General</h2>
      <div class="kpi-grid">
        <KPICard :icon="CurrencyDollarIcon" value="S/ 6.50" label="Tarifa promedio"   color="#C9A84C" />
        <KPICard :icon="MapPinIcon"         :value="totalStops"  label="Total paraderos"  color="#C9A84C" />
        <KPICard :icon="StopCircleIcon"     :value="totalRoutes" label="Total rutas"      color="#C9A84C" />
        <KPICard :icon="ClockIcon"          value="30 min"  label="Intervalo promedio" color="#C9A84C" />
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Acceso Rápido</h2>
      <CompanyInfoCard />
    </section>

    <section class="section">
      <SubscriptionsPrototype />
    </section>

  </div>
</template>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: 2rem; }

.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.75rem 2rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--gold-500);
}
.welcome-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.03em;
}
.welcome-title .gold { color: var(--gold-400); }
.welcome-sub { font-size: 0.9rem; color: var(--carbon-400); margin-top: 4px; }
.welcome-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: var(--radius-md);
  padding: 8px 16px;
  color: var(--gold-400);
  font-size: 13px;
  font-weight: 600;
}

.section { display: flex; flex-direction: column; gap: 1rem; }
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--carbon-200);
  letter-spacing: -0.01em;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .kpi-grid { grid-template-columns: 1fr; } }
</style>
