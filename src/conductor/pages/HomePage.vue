<script setup>
import KPICard from "@/conductor/components/KPICard.vue";
import ConductorInfoCard from "@/conductor/components/ConductorEditCard.vue";
import SubscriptionsPrototype from "@/shared/components/Suscription.vue";
import { MapPinIcon, TruckIcon, StarIcon, CheckCircleIcon } from "@heroicons/vue/24/solid/index.js";
import { ref, onMounted } from 'vue'
import { ConductorService } from '@/conductor/services/conductor.service.js'
import { ConductorAssembler } from '@/conductor/services/conductor.assembler.js'

const conductorName = ref('conductor')
const activeRoutes  = ref('—')
const totalTrips    = ref('—')
const rating        = ref('—')
const availability  = ref('—')

onMounted(async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.username) conductorName.value = user.username

    const svc = new ConductorService()
    // El conductor se resuelve por el usuario IAM logueado (by-user)
    const userId = user.driverId ? null : user.id
    let data = null
    if (user.driverId) {
      data = await svc.getById(user.driverId)
    } else if (userId) {
      data = await svc.getByUserId(userId)
    }

    if (data) {
      const conductor = ConductorAssembler.fromResponseToEntity(data)
      conductorName.value = conductor.fullName || conductorName.value
      availability.value = conductor.isAvailable ? 'Disponible' : 'No disponible'
    }
  } catch { /* non-critical: el conductor puede no estar registrado aun */ }
})
</script>

<template>
  <div class="home-page">

    <div class="welcome-section">
      <div>
        <h1 class="welcome-title">¡Bienvenido, <span class="gold">{{ conductorName }}</span>!</h1>
        <p class="welcome-sub">Panel de gestión de tu actividad como conductor.</p>
      </div>
      <div class="welcome-badge">
        <i class="pi pi-id-card"></i>
        Panel Conductor
      </div>
    </div>

    <section class="section">
      <h2 class="section-title">Resumen General</h2>
      <div class="kpi-grid">
        <KPICard :icon="MapPinIcon"      :value="activeRoutes" label="Rutas activas"     color="#B7A6E0" />
        <KPICard :icon="TruckIcon"       :value="totalTrips"   label="Viajes realizados" color="#B7A6E0" />
        <KPICard :icon="StarIcon"        :value="rating"       label="Calificación"      color="#B7A6E0" />
        <KPICard :icon="CheckCircleIcon" :value="availability" label="Disponibilidad"    color="#B7A6E0" />
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Acceso Rápido</h2>
      <ConductorInfoCard />
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
.welcome-title .gold { color: var(--gold-600); }
.welcome-sub { font-size: 0.9rem; color: var(--carbon-400); margin-top: 4px; }
.welcome-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(183,166,224,0.1);
  border: 1px solid rgba(183,166,224,0.3);
  border-radius: var(--radius-md);
  padding: 8px 16px;
  color: var(--gold-600);
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
