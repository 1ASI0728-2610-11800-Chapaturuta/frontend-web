<template>
  <div class="profile-page">

    <div class="profile-hero">
      <div class="avatar">
        <span class="avatar-initials">{{ initials }}</span>
      </div>
      <div class="profile-info">
        <h1 class="profile-name">{{ user.username || 'Usuario' }}</h1>
        <p class="profile-email">{{ user.email || '' }}</p>
        <span class="role-badge">
          <i class="pi pi-user"></i>
          Viajero
        </span>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stat-box">
        <span class="stat-num">{{ loading ? '—' : stats.trips }}</span>
        <span class="stat-label">Viajes</span>
      </div>
      <div class="stat-box">
        <span class="stat-num">{{ loading ? '—' : stats.collections }}</span>
        <span class="stat-label">Colecciones</span>
      </div>
      <div class="stat-box">
        <span class="stat-num">{{ loading ? '—' : stats.reviews }}</span>
        <span class="stat-label">Reseñas</span>
      </div>
    </div>

    <div class="menu-list">
      <router-link to="/traveller/trips" class="menu-item">
        <div class="menu-icon"><i class="pi pi-map"></i></div>
        <span>Historial de Viajes</span>
        <i class="pi pi-chevron-right menu-arrow"></i>
      </router-link>
      <router-link to="/traveller/collections" class="menu-item">
        <div class="menu-icon"><i class="pi pi-bookmark"></i></div>
        <span>Mis Colecciones</span>
        <i class="pi pi-chevron-right menu-arrow"></i>
      </router-link>
    </div>

    <button class="btn-logout" @click="logout">
      <i class="pi pi-sign-out"></i>
      Cerrar Sesión
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { APP_ROUTES } from '@/shared/services/routes.js'
import { TripService } from '@/trips/services/trip.service.js'
import { CollectionService } from '@/collections/services/collection.service.js'
import { RatingService } from '@/ratings/services/rating.service.js'
import { getUserId } from '@/shared/services/session.service.js'

const router = useRouter()
const user   = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const stats = ref({ trips: 0, collections: 0, reviews: 0 })
const loading = ref(true)

const initials = computed(() => {
  const name = user.value.username || ''
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U'
})

// KPIs reales del viajero: viajes, colecciones y reseñas hechas.
onMounted(async () => {
  const userId = getUserId()
  if (!userId) { loading.value = false; return }
  const [trips, collections, reviews] = await Promise.all([
    new TripService().getTripHistoryByUserId(userId).catch(() => []),
    new CollectionService().getCollectionsByUserId(userId).catch(() => []),
    new RatingService().getByUser(userId).catch(() => [])
  ])
  stats.value = {
    trips: Array.isArray(trips) ? trips.length : 0,
    collections: Array.isArray(collections) ? collections.length : 0,
    reviews: Array.isArray(reviews) ? reviews.length : 0
  }
  loading.value = false
})

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  router.push(`/${APP_ROUTES.AUTH.ROOT}/${APP_ROUTES.AUTH.LOGIN}`)
}
</script>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem 2rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--gold-500);
}
.avatar {
  width: 72px; height: 72px;
  background: rgba(139,92,246,0.15);
  border: 2px solid var(--gold-500);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 24px rgba(139,92,246,0.3);
}
.avatar-initials { font-size: 1.5rem; font-weight: 700; color: var(--gold-400); }
.profile-name { font-size: 1.25rem; font-weight: 700; color: var(--carbon-50); }
.profile-email { font-size: 0.85rem; color: var(--carbon-400); margin-top: 2px; }
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 4px 10px;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--gold-400);
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 1.25rem 1rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
}
.stat-num { font-size: 1.75rem; font-weight: 700; color: var(--gold-400); letter-spacing: -0.03em; }
.stat-label { font-size: 0.75rem; color: var(--carbon-400); }

.menu-list { display: flex; flex-direction: column; gap: 8px; }
.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 1rem 1.5rem;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--carbon-200);
  font-size: 0.9rem;
  font-weight: 500;
  transition: border-color var(--duration-fast) ease;
}
.menu-item:hover { border-color: var(--gold-500); }
.menu-icon {
  width: 36px; height: 36px;
  background: rgba(139,92,246,0.08);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-500);
  flex-shrink: 0;
}
.menu-arrow { margin-left: auto; color: var(--carbon-500); font-size: 11px; }

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  width: 100%;
  background: transparent;
  border: 1px solid rgba(248,113,113,0.3);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}
.btn-logout:hover { background: rgba(248,113,113,0.08); }
</style>
