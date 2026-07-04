<template>
  <header class="company-header">
    <div class="header-inner">

      <div class="brand">
        <img src="@/assets/logo-chapaturuta.png" alt="ChapaTuRuta" class="brand-logo" />
        <span class="brand-name">ChapaTuRuta</span>
      </div>

      <nav class="header-nav">
        <router-link to="/company/home"   class="nav-link">
          <i class="pi pi-home nav-icon"></i>Inicio
        </router-link>
        <router-link to="/company/stops"  class="nav-link">
          <i class="pi pi-map-marker nav-icon"></i>Paraderos
        </router-link>
        <router-link to="/company/routes" class="nav-link">
          <i class="pi pi-directions nav-icon"></i>Rutas
        </router-link>
        <router-link to="/company/information" class="nav-link">
          <i class="pi pi-building nav-icon"></i>Empresa
        </router-link>
      </nav>

      <div class="header-actions">
        <button class="notif-btn">
          <i class="pi pi-bell"></i>
        </button>
        <div class="profile-menu" @click="toggleMenu" ref="menuRef">
          <div class="profile-avatar">
            <i class="pi pi-user"></i>
          </div>
          <span class="profile-label">Mi Perfil</span>
          <i class="pi pi-chevron-down caret"></i>

          <transition name="fade">
            <div v-if="menuOpen" class="dropdown">
              <button class="dropdown-item" @click="logout">
                <i class="pi pi-sign-out"></i>
                Cerrar Sesión
              </button>
            </div>
          </transition>
        </div>
      </div>

    </div>
  </header>
</template>

<script>
export default {
  name: 'CompanyToolbar',
  data() {
    return { menuOpen: false }
  },
  methods: {
    toggleMenu() { this.menuOpen = !this.menuOpen },
    logout() {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      this.$router.push('/auth/login')
    }
  },
  mounted() {
    document.addEventListener('click', (e) => {
      if (!this.$refs.menuRef?.contains(e.target)) {
        this.menuOpen = false
      }
    })
  }
}
</script>

<style scoped>
.company-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--carbon-950);
  border-bottom: 1px solid var(--carbon-700);
  box-shadow: 0 2px 12px rgba(80,60,140,0.10);
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

.brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.brand-logo { height: 36px; object-fit: contain; }
.brand-name { font-size: 1.1rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.02em; }

.header-nav { display: flex; align-items: center; gap: 4px; flex: 1; }
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
.nav-icon { font-size: 13px; }
.nav-link:hover { color: var(--carbon-100); background: rgba(139,92,246,0.08); }
.nav-link.router-link-active {
  color: var(--gold-500);
  background: rgba(139,92,246,0.1);
  font-weight: 600;
}
.nav-link.router-link-active .nav-icon { color: var(--gold-500); }

.header-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.notif-btn {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  color: var(--carbon-200);
  cursor: pointer;
  font-size: 16px;
  transition: border-color var(--duration-fast) ease;
}
.notif-btn:hover { border-color: var(--gold-500); color: var(--gold-500); }

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
  transition: border-color var(--duration-fast) ease;
  user-select: none;
}
.profile-menu:hover { border-color: var(--gold-500); }
.profile-avatar {
  width: 26px; height: 26px;
  background: rgba(139,92,246,0.15);
  border: 1px solid var(--gold-500);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
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
  z-index: 200;
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
  transition: background var(--duration-fast) ease;
  text-align: left;
}
.dropdown-item:hover { background: rgba(248,113,113,0.08); }
</style>
