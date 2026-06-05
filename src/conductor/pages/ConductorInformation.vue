<template>
  <div class="conductor-info-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Perfil del Conductor</h1>
        <p class="page-sub">Gestiona y actualiza tus datos personales, licencia y vehículo</p>
      </div>
      <button type="button" class="btn-availability" :class="{ on: conductor.isAvailable }" @click="toggleAvailability" :disabled="isLoading">
        <i class="pi" :class="conductor.isAvailable ? 'pi-check-circle' : 'pi-times-circle'"></i>
        {{ conductor.isAvailable ? 'Disponible' : 'No disponible' }}
      </button>
    </div>

    <!-- Datos personales -->
    <div class="form-card">
      <h2 class="form-section-title">Datos Personales</h2>
      <form @submit.prevent="saveDriverInfo" class="conductor-form" novalidate>
        <div class="fields-row">
          <div class="field-group">
            <label for="firstName">Nombres <span class="req">*</span></label>
            <input id="firstName" v-model="conductor.firstName" type="text" required placeholder="Nombres" />
          </div>
          <div class="field-group">
            <label for="lastName">Apellidos <span class="req">*</span></label>
            <input id="lastName" v-model="conductor.lastName" type="text" required placeholder="Apellidos" />
          </div>
        </div>

        <div class="fields-row">
          <div class="field-group">
            <label for="documentNumber">DNI</label>
            <input id="documentNumber" v-model="conductor.documentNumber" type="text" disabled placeholder="DNI" />
          </div>
          <div class="field-group">
            <label for="phone">Teléfono <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-phone input-icon"></i>
              <input id="phone" v-model="conductor.phone" type="tel" required placeholder="+51 999 999 999" />
            </div>
          </div>
        </div>

        <div class="field-group">
          <label for="photoUrl">URL de foto de perfil</label>
          <input id="photoUrl" v-model="conductor.photoUrl" type="url" placeholder="https://..." />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? 'Guardando...' : 'Guardar datos personales' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Licencia + Vehiculo -->
    <div class="form-card">
      <h2 class="form-section-title">Vehículo</h2>
      <form @submit.prevent="saveVehicle" class="conductor-form" novalidate>
        <div class="fields-row">
          <div class="field-group">
            <label for="licenseNumber">N° de licencia</label>
            <input id="licenseNumber" v-model="conductor.licenseNumber" type="text" disabled placeholder="N° de licencia" />
          </div>
          <div class="field-group">
            <label for="licenseCategory">Categoría</label>
            <input id="licenseCategory" v-model="conductor.licenseCategory" type="text" disabled placeholder="Categoría" />
          </div>
        </div>

        <div class="fields-row">
          <div class="field-group">
            <label for="plate">Placa <span class="req">*</span></label>
            <input id="plate" v-model="conductor.vehicle.plate" type="text" required placeholder="ABC-123" />
          </div>
          <div class="field-group">
            <label for="vehicleType">Tipo <span class="req">*</span></label>
            <select id="vehicleType" v-model="conductor.vehicle.type" required>
              <option v-for="t in VEHICLE_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div class="fields-row">
          <div class="field-group">
            <label for="brand">Marca</label>
            <input id="brand" v-model="conductor.vehicle.brand" type="text" placeholder="Toyota" />
          </div>
          <div class="field-group">
            <label for="model">Modelo</label>
            <input id="model" v-model="conductor.vehicle.model" type="text" placeholder="Hiace" />
          </div>
        </div>

        <div class="fields-row">
          <div class="field-group">
            <label for="year">Año <span class="req">*</span></label>
            <input id="year" v-model.number="conductor.vehicle.year" type="number" min="1980" required placeholder="2020" />
          </div>
          <div class="field-group">
            <label for="capacity">Capacidad <span class="req">*</span></label>
            <input id="capacity" v-model.number="conductor.vehicle.capacity" type="number" min="1" required placeholder="15" />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? 'Guardando...' : 'Guardar vehículo' }}</span>
          </button>
        </div>
      </form>
    </div>

    <transition name="fade">
      <div v-if="showSuccess" class="success-banner">
        <i class="pi pi-check-circle"></i>
        {{ successMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Conductor } from "@/conductor/models/conductor.entity.js"
import { ConductorService } from "@/conductor/services/conductor.service.js"
import { ConductorAssembler } from "@/conductor/services/conductor.assembler.js"
import { ConductorValidator } from "@/conductor/services/ConductorValidator.js"

const VEHICLE_TYPES = ConductorValidator.VEHICLE_TYPES

const service       = new ConductorService()
const conductor     = reactive(new Conductor({}))
const isLoading     = ref(false)
const showSuccess   = ref(false)
const successMessage = ref('')

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}')

const flash = (msg) => {
  successMessage.value = msg
  showSuccess.value = true
  setTimeout(() => { showSuccess.value = false }, 3000)
}

const loadConductor = async () => {
  const user = getUser()
  try {
    let data = null
    if (user.driverId) {
      data = await service.getById(user.driverId)
    } else if (user.id) {
      data = await service.getByUserId(user.id)
    }
    if (data) {
      const entity = ConductorAssembler.fromResponseToEntity(data)
      Object.assign(conductor, entity)
      conductor.vehicle = entity.vehicle
    }
  } catch (err) {
    console.error('Load error:', err)
  }
}

const saveDriverInfo = async () => {
  isLoading.value = true
  try {
    const id = conductor.id
    if (!id) { alert('No hay conductor asociado al usuario.'); return }
    await service.updateDriver(id, ConductorAssembler.fromEntityToUpdateDriver(conductor))
    flash('Datos personales actualizados')
  } catch (err) {
    console.error('Save driver error:', err)
  } finally {
    isLoading.value = false
  }
}

const saveVehicle = async () => {
  // Validacion minima del vehiculo (placa/anio/capacidad/tipo)
  const errors = ConductorValidator.validate(conductor)
  const vehicleErrors = errors.filter(e => /placa|veh|capacidad|a.o/i.test(e))
  if (vehicleErrors.length > 0) {
    alert(`Por favor corrija:\n\n${vehicleErrors.map(e => `• ${e}`).join('\n')}`)
    return
  }
  isLoading.value = true
  try {
    const id = conductor.id
    if (!id) { alert('No hay conductor asociado al usuario.'); return }
    await service.updateVehicle(id, ConductorAssembler.fromEntityToUpdateVehicle(conductor))
    flash('Vehículo actualizado')
  } catch (err) {
    console.error('Save vehicle error:', err)
  } finally {
    isLoading.value = false
  }
}

const toggleAvailability = async () => {
  isLoading.value = true
  try {
    const id = conductor.id
    if (!id) { alert('No hay conductor asociado al usuario.'); return }
    const updated = await service.updateAvailability(id)
    conductor.isAvailable = updated?.isAvailable ?? !conductor.isAvailable
    flash(conductor.isAvailable ? 'Ahora estás disponible' : 'Ahora estás no disponible')
  } catch (err) {
    console.error('Toggle availability error:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadConductor)
</script>

<style scoped>
.conductor-info-page { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.02em;
}
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

.btn-availability {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.3);
  border-radius: var(--radius-md);
  color: var(--danger, #f87171);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--duration-fast) ease;
}
.btn-availability.on {
  background: rgba(74,222,128,0.1);
  border-color: rgba(74,222,128,0.3);
  color: var(--success, #4ade80);
}
.btn-availability:disabled { opacity: 0.6; cursor: not-allowed; }

.form-card {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  padding: 2rem;
}
.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--carbon-200);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--carbon-700);
}

.conductor-form { display: flex; flex-direction: column; gap: 1rem; }
.fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 600px) { .fields-row { grid-template-columns: 1fr; } }

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group label {
  font-size: 11px;
  font-weight: 500;
  color: var(--carbon-400);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.req { color: var(--danger); }

.input-wrap { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; color: var(--carbon-500); font-size: 13px; pointer-events: none; }

.field-group input,
.field-group select {
  width: 100%;
  padding: 10px 14px;
  background: var(--carbon-900);
  border: 1px solid var(--carbon-600);
  border-radius: var(--radius-md);
  color: var(--carbon-100);
  font-size: 14px;
  font-family: var(--font-family);
  transition: border-color var(--duration-normal) ease;
  outline: none;
  box-sizing: border-box;
}
.input-wrap input { padding-left: 36px; }
.field-group input::placeholder { color: var(--carbon-500); }
.field-group input:focus,
.field-group select:focus { border-color: var(--gold-500); box-shadow: 0 0 0 2px rgba(183,166,224,0.15); }
.field-group input:disabled { opacity: 0.6; cursor: not-allowed; }

.success-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(74,222,128,0.1);
  border: 1px solid rgba(74,222,128,0.3);
  border-radius: var(--radius-md);
  color: var(--success);
  font-size: 13px;
  padding: 10px 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 1rem;
  border-top: 1px solid var(--carbon-700);
  margin-top: 0.5rem;
}
.btn-save {
  padding: 10px 24px;
  background: var(--gradient-gold);
  border: none;
  border-radius: var(--radius-md);
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-family);
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: opacity var(--duration-fast) ease;
}
.btn-save:hover:not(:disabled) { opacity: 0.88; }
.btn-save:disabled { background: var(--carbon-700); color: var(--carbon-500); cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid var(--ink);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
