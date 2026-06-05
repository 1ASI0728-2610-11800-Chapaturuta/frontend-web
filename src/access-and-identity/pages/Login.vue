<template>
  <div class="login-page">

    <!-- Lang switcher -->
    <div class="lang-switcher">
      <button @click="setLang('es')" :class="{ active: locale === 'es' }">ES</button>
      <button @click="setLang('en')" :class="{ active: locale === 'en' }">EN</button>
    </div>

    <!-- Logo -->
    <transition name="fade-down" appear>
      <div class="logo-section">
        <div class="logo-glow">
          <img src="@/assets/logo-chapaturuta.png" alt="ChapaTuRuta" class="logo" />
        </div>
        <h2 class="brand">ChapaTuRuta</h2>
        <p class="brand-sub">Tu guía de transporte urbano</p>
      </div>
    </transition>

    <!-- Card -->
    <transition name="slide-up" appear>
      <div class="auth-card">
        <h1>{{ t('login.title') }}</h1>

        <form @submit.prevent="handleLogin" novalidate>

          <div class="field-group" :class="{ error: emailTouched && !isEmailValid }">
            <label for="email">{{ t('login.email') }}</label>
            <div class="input-wrapper">
              <i class="pi pi-envelope input-icon"></i>
              <input
                id="email"
                type="email"
                v-model.trim="email"
                @blur="emailTouched = true"
                :placeholder="t('login.emailPlaceholder')"
                autocomplete="email"
              />
            </div>
            <small v-if="emailTouched && !isEmailValid">{{ t('login.invalidEmail') }}</small>
          </div>

          <div class="field-group" :class="{ error: passwordTouched && !password }">
            <label for="password">{{ t('login.password') }}</label>
            <div class="input-wrapper">
              <i class="pi pi-lock input-icon"></i>
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model.trim="password"
                @blur="passwordTouched = true"
                :placeholder="t('login.passwordPlaceholder')"
                autocomplete="current-password"
              />
              <button type="button" class="toggle-pwd" @click="showPassword = !showPassword" tabindex="-1">
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <small v-if="passwordTouched && !password">{{ t('login.requiredPassword') }}</small>
          </div>

          <transition name="fade">
            <div v-if="error" class="error-banner">
              <i class="pi pi-exclamation-circle"></i>
              {{ t(error) }}
            </div>
          </transition>

          <button type="submit" class="btn-primary" :disabled="isLoading || !canSubmit">
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? t('login.loading') : t('login.button') }}</span>
          </button>

        </form>

        <div class="switch-link">
          {{ t('login.noAccount') }}
          <router-link :to="`/${APP_ROUTES.AUTH.ROOT}/${APP_ROUTES.AUTH.REGISTER}`">{{ t('login.register') }}</router-link>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { APP_ROUTES } from '@/shared/services/routes.js'
import { AuthService } from '@/access-and-identity/services/auth.service.js'
import { ConductorService } from '@/conductor/services/conductor.service.js'

const { t, locale } = useI18n()

const email         = ref('')
const password      = ref('')
const showPassword  = ref(false)
const error         = ref(null)
const isLoading     = ref(false)
const emailTouched  = ref(false)
const passwordTouched = ref(false)

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const canSubmit    = computed(() => email.value && isEmailValid.value && password.value)

function setLang(lang) { locale.value = lang }

async function handleLogin() {
  isLoading.value = true
  error.value = null
  try {
    const authService = new AuthService()
    const response = await authService.login({ email: email.value, password: password.value })

    // Token estandarizado en 'authToken' (lo lee el interceptor de base-service)
    localStorage.setItem('authToken', response.token)

    // Datos base del usuario autenticado (AuthenticatedUserResource: id, username, role, token)
    const user = {
      id: response.id,
      username: response.username,
      role: response.role
    }
    localStorage.setItem('user', JSON.stringify(user))

    // Pasajero (Traveller = 0): home de descubrimiento
    if (response.role === 0) {
      window.location.href = '/'
      return
    }

    // Conductor (Driver = 2): resolver su perfil de conductor
    if (response.role === 2) {
      const conductorService = new ConductorService()
      try {
        const driverData = await conductorService.getByUserId(response.id)
        // Si no existe perfil de conductor todavia, ir al onboarding
        if (!driverData || !driverData.id) {
          window.location.href = '/conductor/onboarding'
          return
        }
        // Guardar driverId (id del conductor) en el user de localStorage
        user.driverId = driverData.id
        localStorage.setItem('user', JSON.stringify(user))
        window.location.href = '/conductor/home'
      } catch (err) {
        // Conductor sin perfil de driver aun (404/null) -> onboarding
        if (err?.status === 404) {
          window.location.href = '/conductor/onboarding'
          return
        }
        throw err
      }
      return
    }

    // Admin (Admin = 3): stub de administracion (TODO: panel admin real)
    if (response.role === 3) {
      window.location.href = '/admin/plans'
      return
    }

  } catch (err) {
    console.error('Login error:', err)
    error.value = 'login.error'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* ── Layout ── */
.login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 1.5rem;
  background: linear-gradient(180deg, var(--carbon-950) 0%, var(--carbon-900) 50%, var(--carbon-800) 100%);
  gap: 1.5rem;
}

/* ── Lang switcher ── */
.lang-switcher {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  display: flex;
  gap: 6px;
  background: var(--carbon-800);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  border: 1px solid var(--carbon-700);
}
.lang-switcher button {
  background: transparent;
  border: none;
  color: var(--carbon-400);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all var(--duration-fast) ease;
  font-family: var(--font-family);
}
.lang-switcher button:hover { color: var(--carbon-100); background: var(--carbon-700); }
.lang-switcher .active { background: var(--gold-500); color: var(--ink); }

/* ── Logo section ── */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.logo-glow {
  box-shadow: 0 0 32px rgba(183,166,224,0.25);
  border-radius: 50%;
}
.logo {
  height: 90px;
  object-fit: contain;
  border-radius: 50%;
}
.brand {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.03em;
}
.brand-sub {
  font-size: 0.85rem;
  color: var(--carbon-400);
}

/* ── Card ── */
.auth-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255,255,255,0.85);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(183,166,224,0.25);
  padding: 2rem;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-elevated);
}
.auth-card h1 {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
}

/* ── Field ── */
.field-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--carbon-400);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 12px;
  color: var(--carbon-400);
  font-size: 14px;
  pointer-events: none;
}
.input-wrapper input {
  width: 100%;
  padding: 11px 14px 11px 36px;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  color: var(--carbon-100);
  font-size: 14px;
  font-family: var(--font-family);
  transition: border-color var(--duration-normal) ease;
  outline: none;
}
.input-wrapper input::placeholder { color: var(--carbon-400); }
.input-wrapper input:focus { border-color: var(--gold-500); box-shadow: 0 0 0 2px rgba(183,166,224,0.15); }
.field-group.error input { border-color: var(--danger); }
.field-group small { color: var(--danger); font-size: 11px; }
.toggle-pwd {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--carbon-400);
  cursor: pointer;
  padding: 4px;
}
.toggle-pwd:hover { color: var(--carbon-100); }

/* ── Error banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(248,113,113,0.12);
  border: 1px solid rgba(248,113,113,0.3);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 13px;
  padding: 10px 14px;
  margin-bottom: 0.75rem;
}

/* ── Primary button ── */
.btn-primary {
  width: 100%;
  padding: 13px;
  margin-top: 1rem;
  background: var(--gradient-gold);
  color: var(--ink);
  font-weight: 700;
  font-size: 15px;
  font-family: var(--font-family);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity var(--duration-fast) ease, box-shadow var(--duration-normal) ease;
  box-shadow: 0 4px 20px rgba(183,166,224,0.3);
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; box-shadow: var(--shadow-gold); }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { background: var(--carbon-700); color: var(--carbon-400); cursor: not-allowed; box-shadow: none; }

/* ── Spinner ── */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--ink);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Switch link ── */
.switch-link {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 13px;
  color: var(--carbon-400);
}
.switch-link a { color: var(--gold-600); text-decoration: none; font-weight: 600; margin-left: 4px; }
.switch-link a:hover { color: var(--lilac-500); }

/* ── Transitions ── */
.fade-down-enter-active { transition: all var(--duration-slow) var(--ease-out-expo); }
.fade-down-enter-from   { opacity: 0; transform: translateY(-16px); }
.slide-up-enter-active  { transition: all 0.6s var(--ease-out-expo); transition-delay: 0.15s; }
.slide-up-enter-from    { opacity: 0; transform: translateY(24px); }
</style>
