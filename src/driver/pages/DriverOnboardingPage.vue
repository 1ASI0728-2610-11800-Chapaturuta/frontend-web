<template>
  <div class="onboarding-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Perfil de conductor</h1>
        <p class="page-sub">Completa tus datos para gestionar paraderos, rutas y viajes.</p>
      </div>
    </div>

    <form class="form-card" @submit.prevent="submit">
      <div class="section-title">Datos personales</div>
      <div class="grid two">
        <label class="field">
          <span>Nombres</span>
          <input v-model.trim="driver.firstName" placeholder="Juan" />
        </label>
        <label class="field">
          <span>Apellidos</span>
          <input v-model.trim="driver.lastName" placeholder="Perez" />
        </label>
        <label class="field">
          <span>DNI</span>
          <input v-model.trim="driver.documentNumber" maxlength="8" placeholder="12345678" />
        </label>
        <label class="field">
          <span>Telefono</span>
          <input v-model.trim="driver.phone" placeholder="999999999" />
        </label>
        <label class="field full">
          <span>Foto URL</span>
          <input v-model.trim="driver.photoUrl" placeholder="https://..." />
        </label>
      </div>

      <div class="section-title">Licencia y vehiculo</div>
      <div class="grid two">
        <label class="field">
          <span>Licencia</span>
          <input v-model.trim="driver.licenseNumber" placeholder="Q12345678" />
        </label>
        <label class="field">
          <span>Categoria</span>
          <select v-model.number="driver.licenseCategory">
            <option v-for="item in LICENSE_CATEGORIES" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>Placa</span>
          <input v-model.trim="driver.vehiclePlate" placeholder="ABC-123" />
        </label>
        <label class="field">
          <span>Tipo</span>
          <select v-model.number="driver.vehicleType">
            <option v-for="item in VEHICLE_TYPES" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>Marca</span>
          <input v-model.trim="driver.vehicleBrand" placeholder="Toyota" />
        </label>
        <label class="field">
          <span>Modelo</span>
          <input v-model.trim="driver.vehicleModel" placeholder="Hiace" />
        </label>
        <label class="field">
          <span>Anio</span>
          <input v-model.number="driver.vehicleYear" type="number" min="1980" />
        </label>
        <label class="field">
          <span>Capacidad</span>
          <input v-model.number="driver.vehicleCapacity" type="number" min="1" />
        </label>
      </div>

      <div v-if="errors.length" class="error-box">
        <p v-for="error in errors" :key="error">{{ error }}</p>
      </div>
      <div v-if="apiError" class="error-box">{{ apiError }}</div>

      <div class="actions">
        <button class="btn-save" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Creando...' : 'Crear perfil' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DriverService } from '@/driver/services/driver.service.js'
import { DriverValidator } from '@/driver/services/driver.validator.js'
import { Driver, LICENSE_CATEGORIES, VEHICLE_TYPES } from '@/driver/models/driver.entity.js'
import { getCurrentUser, saveCurrentUser } from '@/shared/services/session.service.js'

const router = useRouter()
const service = new DriverService()
const user = getCurrentUser()
const nameParts = (user.username || '').split(' ')
const driver = reactive(new Driver({
  fkIdUser: user.id,
  firstName: nameParts[0] || '',
  lastName: nameParts.slice(1).join(' ') || ''
}))
const loading = ref(false)
const apiError = ref('')
const errors = ref([])

async function submit() {
  errors.value = DriverValidator.validateProfile(driver)
  apiError.value = ''
  if (errors.value.length) return

  loading.value = true
  try {
    const created = await service.createDriver(driver)
    saveCurrentUser({ ...user, role: 2, driverId: created.id })
    await router.push('/driver/home')
  } catch (err) {
    apiError.value = err?.data?.message || err?.message || 'No se pudo crear el perfil de conductor'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.onboarding-page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
.page-header { margin-bottom: 1rem; }
.page-title { font-size: 1.6rem; font-weight: 700; color: var(--carbon-50); }
.page-sub { color: var(--carbon-400); margin-top: 4px; }
.form-card {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.section-title { color: var(--gold-400); font-weight: 700; font-size: 0.95rem; }
.grid { display: grid; gap: 1rem; }
.grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.field span { color: var(--carbon-400); font-size: 11px; text-transform: uppercase; font-weight: 600; }
.field input, .field select {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--carbon-600);
  background: var(--carbon-900);
  color: var(--carbon-100);
  font-family: var(--font-family);
}
.field input:focus, .field select:focus { outline: none; border-color: var(--gold-500); }
.error-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.3);
  color: var(--danger);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 13px;
}
.actions { display: flex; justify-content: flex-end; border-top: 1px solid var(--carbon-700); padding-top: 1rem; }
.btn-save {
  border: none;
  background: var(--gradient-gold);
  color: var(--carbon-950);
  border-radius: var(--radius-md);
  padding: 11px 20px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 14px; height: 14px; border: 2px solid var(--carbon-950); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) { .grid.two { grid-template-columns: 1fr; } .field.full { grid-column: auto; } }
</style>
