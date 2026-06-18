<template>
  <header class="driver-header">
    <div class="header-inner">
      <div class="brand">
        <img src="@/assets/logo-chapaturuta.png" alt="ChapaTuRuta" class="brand-logo" />
        <span class="brand-name">ChapaTuRuta</span>
      </div>

      <nav class="header-nav">
        <router-link to="/driver/home" class="nav-link"><i class="pi pi-home nav-icon"></i>Inicio</router-link>
        <router-link to="/driver/dashboard" class="nav-link"><i class="pi pi-chart-bar nav-icon"></i>Dashboard</router-link>
        <router-link to="/driver/trips" class="nav-link"><i class="pi pi-car nav-icon"></i>Viajes</router-link>
        <router-link to="/driver/stops" class="nav-link"><i class="pi pi-map-marker nav-icon"></i>Paraderos</router-link>
        <router-link to="/driver/routes" class="nav-link"><i class="pi pi-directions nav-icon"></i>Rutas</router-link>
        <router-link to="/driver/payments" class="nav-link"><i class="pi pi-wallet nav-icon"></i>Pagos</router-link>
        <router-link to="/driver/subscriptions" class="nav-link"><i class="pi pi-star nav-icon"></i>Planes</router-link>
        <router-link to="/driver/information" class="nav-link"><i class="pi pi-id-card nav-icon"></i>Conductor</router-link>
      </nav>

      <div class="header-actions">
        <div class="profile-menu" @click="toggleMenu" ref="menuRef">
          <div class="profile-avatar"><i class="pi pi-user"></i></div>
          <span class="profile-label">Mi Perfil</span>
          <i class="pi pi-chevron-down caret"></i>
          <transition name="fade">
            <div v-if="menuOpen" class="dropdown">
              <button class="dropdown-item" @click.stop="logout">
                <i class="pi pi-sign-out"></i>
                Cerrar Sesion
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { clearSession } from '@/shared/services/session.service.js'

export default {
  name: 'DriverToolbar',
  data() {
    return { menuOpen: false }
  },
  methods: {
    toggleMenu() { this.menuOpen = !this.menuOpen },
    logout() {
      clearSession()
      this.$router.push('/auth/login')
    }
  },
  mounted() {
    this._outsideClick = (e) => {
      if (!this.$refs.menuRef?.contains(e.target)) this.menuOpen = false
    }
    document.addEventListener('click', this._outsideClick)
  },
  beforeUnmount() {
    document.removeEventListener('click', this._outsideClick)
  }
}
</script>

<style scoped>
.driver-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--carbon-950);
  border-bottom: 1px solid var(--carbon-700);
  box-shadow: 0 2px 20px rgba(0,0,0,0.4);
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.brand-logo { height: 36px; object-fit: contain; }
.brand-name { font-size: 1.1rem; font-weight: 700; color: var(--carbon-50); }
.header-nav { display: flex; align-items: center; gap: 4px; flex: 1; flex-wrap: wrap; }
.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--carbon-400);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
}
.nav-icon { font-size: 13px; }
.nav-link:hover { color: var(--carbon-100); background: var(--carbon-800); }
.nav-link.router-link-active { color: var(--gold-500); background: rgba(201,168,76,0.1); font-weight: 600; }
.header-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.profile-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
}
.profile-menu:hover { border-color: var(--gold-500); }
.profile-avatar {
  width: 26px;
  height: 26px;
  background: rgba(201,168,76,0.15);
  border: 1px solid var(--gold-500);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-500);
  font-size: 12px;
}
.profile-label { font-size: 13px; font-weight: 500; color: var(--carbon-200); }
.caret { font-size: 10px; color: var(--carbon-400); }
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-elevated);
  overflow: hidden;
}
.dropdown-item {
  width: 100%;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--danger);
  font-size: 13px;
  font-family: var(--font-family);
  cursor: pointer;
}
.dropdown-item:hover { background: rgba(248,113,113,0.08); }
@media (max-width: 900px) {
  .header-inner { align-items: flex-start; flex-direction: column; padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .header-actions { margin-left: 0; }
}
</style>
