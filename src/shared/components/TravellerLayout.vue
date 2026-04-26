<template>
  <header class="traveller-header">
    <div class="header-inner">
      <div class="brand">
        <img src="@/assets/logo-chapaturuta.png" alt="ChapaTuRuta" class="brand-logo" />
        <span class="brand-name">ChapaTuRuta</span>
      </div>

      <nav class="header-nav">
        <router-link to="/" class="nav-link">
          <i class="pi pi-compass nav-icon"></i>Descubrir
        </router-link>
        <router-link :to="`/${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.COLLECTIONS}`" class="nav-link">
          <i class="pi pi-bookmark nav-icon"></i>Colecciones
        </router-link>
        <router-link :to="`/${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.TRIPS}`" class="nav-link">
          <i class="pi pi-map nav-icon"></i>Viajes
        </router-link>
        <router-link :to="`/${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.PROFILE}`" class="nav-link">
          <i class="pi pi-user nav-icon"></i>Perfil
        </router-link>
      </nav>

      <div class="header-actions">
        <button class="notif-btn">
          <i class="pi pi-bell"></i>
        </button>
        <template v-if="isLoggedIn">
          <router-link :to="`/${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.PROFILE}`" class="btn-profile">
            <div class="profile-avatar"><i class="pi pi-user"></i></div>
            <span>Mi Perfil</span>
          </router-link>
        </template>
        <template v-else>
          <router-link :to="`/${APP_ROUTES.AUTH.ROOT}/${APP_ROUTES.AUTH.LOGIN}`" class="btn-signin">
            Iniciar Sesión
          </router-link>
        </template>
      </div>
    </div>
  </header>

  <main class="traveller-main">
    <transition name="page" mode="out-in">
      <router-view />
    </transition>
  </main>
</template>

<script>
import { APP_ROUTES } from '@/shared/services/routes.js'

export default {
  name: 'TravellerLayout',
  data() {
    return {
      APP_ROUTES,
      isLoggedIn: !!localStorage.getItem('authToken')
    }
  }
}
</script>

<style scoped>
.traveller-header {
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
  height: 64px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.brand-logo { height: 36px; object-fit: contain; }
.brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.02em;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}
.nav-icon { font-size: 13px; }
.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--carbon-400);
  font-size: 14px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) ease, background var(--duration-fast) ease;
}
.nav-link:hover { color: var(--carbon-100); background: var(--carbon-800); }
.nav-link.router-link-active {
  color: var(--gold-500);
  background: rgba(201,168,76,0.1);
  font-weight: 600;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.notif-btn {
  position: relative;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  color: var(--carbon-200);
  cursor: pointer;
  transition: border-color var(--duration-fast) ease;
  font-size: 16px;
}
.notif-btn:hover { border-color: var(--gold-500); color: var(--gold-500); }
.notif-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--gold-500);
  color: var(--carbon-950);
  font-size: 9px;
  font-weight: 700;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-signin {
  text-decoration: none;
  padding: 7px 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--gold-500);
  color: var(--gold-500);
  font-size: 13px;
  font-weight: 600;
  transition: all var(--duration-fast) ease;
}
.btn-signin:hover {
  background: var(--gold-500);
  color: var(--carbon-950);
}
.btn-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  padding: 6px 14px;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  color: var(--carbon-200);
  font-size: 13px;
  font-weight: 500;
  transition: border-color var(--duration-fast) ease;
}
.btn-profile:hover { border-color: var(--gold-500); }
.profile-avatar {
  width: 26px; height: 26px;
  background: rgba(201,168,76,0.15);
  border: 1px solid var(--gold-500);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--gold-500);
  font-size: 12px;
}

.traveller-main {
  min-height: calc(100vh - 64px);
  background: var(--carbon-900);
}
</style>
