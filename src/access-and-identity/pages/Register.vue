<template>
  <div class="register-page">

    <div class="lang-switcher">
      <button @click="setLang('es')" :class="{ active: locale === 'es' }">ES</button>
      <button @click="setLang('en')" :class="{ active: locale === 'en' }">EN</button>
    </div>

    <transition name="fade-down" appear>
      <div class="logo-section">
        <div class="logo-glow">
          <img src="@/assets/logo-chapaturuta.png" alt="ChapaTuRuta" class="logo" />
        </div>
        <h2 class="brand">ChapaTuRuta</h2>
      </div>
    </transition>

    <transition name="slide-up" appear>
      <div class="auth-card">
        <h1>{{ t('register.title') }}</h1>

        <form @submit.prevent="handleSubmit" novalidate>

          <div class="fields-row">
            <div class="field-group" :class="{ error: touched.firstName && !firstName }">
              <label>{{ t('register.firstNamePlaceholder') }}</label>
              <input type="text" v-model.trim="firstName" @blur="touched.firstName = true" :placeholder="t('register.firstNamePlaceholder')" />
              <small v-if="touched.firstName && !firstName">{{ t('register.required') }}</small>
            </div>
            <div class="field-group" :class="{ error: touched.lastName && !lastName }">
              <label>{{ t('register.lastNamePlaceholder') }}</label>
              <input type="text" v-model.trim="lastName" @blur="touched.lastName = true" :placeholder="t('register.lastNamePlaceholder')" />
              <small v-if="touched.lastName && !lastName">{{ t('register.required') }}</small>
            </div>
          </div>

          <div class="field-group" :class="{ error: touched.email && !isEmailValid }">
            <label>{{ t('register.emailPlaceholder') }}</label>
            <div class="input-wrapper">
              <i class="pi pi-envelope input-icon"></i>
              <input type="email" v-model.trim="email" @blur="touched.email = true" :placeholder="t('register.emailPlaceholder')" />
            </div>
            <small v-if="touched.email && !isEmailValid">{{ t('register.invalidEmail') }}</small>
          </div>

          <div class="field-group" :class="{ error: touched.password && !password }">
            <label>{{ t('register.passwordPlaceholder') }}</label>
            <div class="input-wrapper">
              <i class="pi pi-lock input-icon"></i>
              <input :type="showPwd ? 'text' : 'password'" v-model.trim="password" @blur="touched.password = true" :placeholder="t('register.passwordPlaceholder')" />
              <button type="button" class="toggle-pwd" @click="showPwd = !showPwd" tabindex="-1">
                <i :class="showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <small v-if="touched.password && !password">{{ t('register.required') }}</small>
          </div>

          <div class="field-group" :class="{ error: touched.role && !role }">
            <label>{{ t('register.selectRole') }}</label>
            <select v-model="role" @blur="touched.role = true">
              <option disabled value="">{{ t('register.selectRole') }}</option>
              <option value="0">{{ t('register.driver') }}</option>
              <option value="1">{{ t('register.manager') }}</option>
            </select>
            <small v-if="touched.role && !role">{{ t('register.selectRequired') }}</small>
          </div>

          <transition name="fade">
            <div v-if="message" :class="['message-banner', messageType]">
              <i :class="messageType === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'"></i>
              {{ message }}
            </div>
          </transition>

          <button type="submit" class="btn-primary" :disabled="!canSubmit || isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? t('register.processing') : t('register.button') }}</span>
          </button>

        </form>

        <div class="switch-link">
          {{ t('register.hasAccount') }}
          <router-link :to="`/${APP_ROUTES.AUTH.ROOT}/${APP_ROUTES.AUTH.LOGIN}`">{{ t('register.loginLink') }}</router-link>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { APP_ROUTES } from '@/shared/services/routes.js'
import { AuthService } from '@/access-and-identity/services/auth.service.js'

const { t, locale } = useI18n()

const firstName   = ref('')
const lastName    = ref('')
const email       = ref('')
const password    = ref('')
const role        = ref('')
const showPwd     = ref(false)
const isLoading   = ref(false)
const message     = ref(null)
const messageType = ref('success')

const touched = reactive({ firstName: false, lastName: false, email: false, password: false, role: false })

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const canSubmit    = computed(() =>
  firstName.value && lastName.value && isEmailValid.value && password.value && role.value !== ''
)

function setLang(lang) { locale.value = lang }

async function handleSubmit() {
  isLoading.value = true
  message.value = null
  try {
    const authService = new AuthService()
    await authService.register({
      username: `${firstName.value} ${lastName.value}`.trim(),
      email: email.value,
      password: password.value,
      role: role.value
    })
    messageType.value = 'success'
    message.value = t('register.success')
    localStorage.setItem('registeredUser', JSON.stringify({ firstName: firstName.value, lastName: lastName.value, email: email.value, role: role.value }))
    setTimeout(() => { window.location.href = `/${APP_ROUTES.AUTH.ROOT}/${APP_ROUTES.AUTH.LOGIN}` }, 1200)
  } catch (err) {
    console.error('Register error:', err)
    messageType.value = 'error'
    message.value = t('register.error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-page {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 1.5rem;
  background: linear-gradient(180deg, var(--carbon-950) 0%, var(--carbon-900) 50%, var(--carbon-800) 100%);
  gap: 1.25rem;
}

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
.lang-switcher .active { background: var(--gold-500); color: var(--carbon-950); }

.logo-section { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.logo-glow { box-shadow: 0 0 32px rgba(201,168,76,0.25); border-radius: 50%; }
.logo { height: 72px; object-fit: contain; border-radius: 50%; }
.brand { font-size: 1.5rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.03em; }

.auth-card {
  width: 100%;
  max-width: 480px;
  background: rgba(45,45,45,0.8);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(201,168,76,0.2);
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

.fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.field-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 6px; }
.field-group label { font-size: 11px; font-weight: 500; color: var(--carbon-400); text-transform: uppercase; letter-spacing: 0.04em; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; color: var(--carbon-400); font-size: 13px; pointer-events: none; }

.field-group input,
.field-group select {
  width: 100%;
  padding: 11px 14px;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  color: var(--carbon-100);
  font-size: 14px;
  font-family: var(--font-family);
  transition: border-color var(--duration-normal) ease;
  outline: none;
  appearance: none;
}
.input-wrapper input { padding-left: 36px; }
.field-group input::placeholder { color: var(--carbon-400); }
.field-group input:focus,
.field-group select:focus { border-color: var(--gold-500); box-shadow: 0 0 0 2px rgba(201,168,76,0.15); }
.field-group.error input,
.field-group.error select { border-color: var(--danger); }
.field-group small { color: var(--danger); font-size: 11px; }

.toggle-pwd { position: absolute; right: 10px; background: none; border: none; color: var(--carbon-400); cursor: pointer; padding: 4px; }
.toggle-pwd:hover { color: var(--carbon-100); }

.message-banner {
  display: flex; align-items: center; gap: 8px;
  border-radius: var(--radius-md); font-size: 13px; padding: 10px 14px; margin-bottom: 0.75rem;
}
.message-banner.success { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3); color: var(--success); }
.message-banner.error   { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: var(--danger); }

.btn-primary {
  width: 100%; padding: 13px; margin-top: 0.5rem;
  background: var(--gradient-gold); color: var(--carbon-950);
  font-weight: 700; font-size: 15px; font-family: var(--font-family);
  border: none; border-radius: var(--radius-md); cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity var(--duration-fast) ease, box-shadow var(--duration-normal) ease;
  box-shadow: 0 4px 20px rgba(201,168,76,0.3);
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { background: var(--carbon-700); color: var(--carbon-400); cursor: not-allowed; box-shadow: none; }

.spinner { width: 16px; height: 16px; border: 2px solid var(--carbon-950); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.switch-link { margin-top: 1.25rem; text-align: center; font-size: 13px; color: var(--carbon-400); }
.switch-link a { color: var(--gold-300); text-decoration: none; font-weight: 500; margin-left: 4px; }
.switch-link a:hover { color: var(--gold-400); }

.fade-down-enter-active { transition: all var(--duration-slow) var(--ease-out-expo); }
.fade-down-enter-from   { opacity: 0; transform: translateY(-16px); }
.slide-up-enter-active  { transition: all 0.6s var(--ease-out-expo); transition-delay: 0.1s; }
.slide-up-enter-from    { opacity: 0; transform: translateY(24px); }
</style>
