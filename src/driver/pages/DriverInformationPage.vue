<template>
  <div class="driver-info-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Informacion del Conductor</h1>
        <p class="page-sub">Gestiona tus datos personales y el vehiculo que opera tus rutas.</p>
      </div>
      <button v-if="driver.id" class="availability-btn" type="button" @click="toggleAvailability">
        <i :class="driver.isAvailable ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        {{ driver.isAvailable ? 'Disponible' : 'No disponible' }}
      </button>
    </div>

    <form class="form-card" @submit.prevent="save">
      <div v-if="loading" class="state">Cargando perfil...</div>
      <div v-else-if="loadError" class="error-box">{{ loadError }}</div>
      <template v-else>
        <div class="section-title">Datos personales</div>

        <div class="photo-block">
          <div class="photo-preview">
            <img v-if="photoPreview || driver.photoUrl" :src="photoPreview || driver.photoUrl" alt="Foto conductor" />
            <i v-else class="pi pi-user"></i>
          </div>
          <div class="photo-controls">
            <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileSelected" />
            <button class="btn-photo" type="button" @click="fileInput?.click()">
              <i class="pi pi-image"></i> Elegir foto
            </button>
            <button
              v-if="photoFile"
              class="btn-photo upload"
              type="button"
              :disabled="uploadingPhoto"
              @click="uploadPhoto"
            >
              <span v-if="uploadingPhoto" class="spinner"></span>
              {{ uploadingPhoto ? 'Subiendo...' : 'Subir a Cloudinary' }}
            </button>
            <p class="photo-hint">JPG/PNG, máx 5 MB</p>
          </div>
        </div>

        <div class="grid two">
          <label class="field"><span>Nombres</span><input v-model.trim="driver.firstName" /></label>
          <label class="field"><span>Apellidos</span><input v-model.trim="driver.lastName" /></label>
          <label class="field"><span>DNI</span><input v-model="driver.documentNumber" disabled /></label>
          <label class="field"><span>Telefono</span><input v-model.trim="driver.phone" /></label>
          <label class="field full"><span>Foto URL</span><input v-model.trim="driver.photoUrl" /></label>
        </div>

        <div class="section-title">Licencia y vehiculo</div>
        <div class="grid two">
          <label class="field"><span>Licencia</span><input v-model="driver.licenseNumber" disabled /></label>
          <label class="field">
            <span>Categoria</span>
            <select v-model.number="driver.licenseCategory" disabled>
              <option v-for="item in LICENSE_CATEGORIES" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
          <label class="field"><span>Placa</span><input v-model.trim="driver.vehiclePlate" /></label>
          <label class="field">
            <span>Tipo</span>
            <select v-model.number="driver.vehicleType">
              <option v-for="item in VEHICLE_TYPES" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
          <label class="field"><span>Marca</span><input v-model.trim="driver.vehicleBrand" /></label>
          <label class="field"><span>Modelo</span><input v-model.trim="driver.vehicleModel" /></label>
          <label class="field"><span>Anio</span><input v-model.number="driver.vehicleYear" type="number" min="1980" /></label>
          <label class="field"><span>Capacidad</span><input v-model.number="driver.vehicleCapacity" type="number" min="1" /></label>
        </div>

        <div v-if="errors.length" class="error-box">
          <p v-for="error in errors" :key="error">{{ error }}</p>
        </div>
        <div v-if="success" class="success-box">Informacion guardada exitosamente</div>

        <div class="actions">
          <button class="btn-cancel" type="button" @click="load">Cancelar</button>
          <button class="btn-save" type="submit" :disabled="saving">
            <span v-if="saving" class="spinner"></span>
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </template>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { DriverService } from '@/driver/services/driver.service.js'
import { DriverValidator } from '@/driver/services/driver.validator.js'
import { Driver, LICENSE_CATEGORIES, VEHICLE_TYPES } from '@/driver/models/driver.entity.js'
import { getCurrentUser, getDriverId, saveCurrentUser } from '@/shared/services/session.service.js'

const service = new DriverService()
const driver = reactive(new Driver())
const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const errors = ref([])
const success = ref(false)

const fileInput = ref(null)
const photoFile = ref(null)
const photoPreview = ref('')
const uploadingPhoto = ref(false)

function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errors.value = ['El archivo debe ser una imagen']
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errors.value = ['La imagen no debe superar 5 MB']
    return
  }
  errors.value = []
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

async function uploadPhoto() {
  if (!photoFile.value || !driver.id) return
  uploadingPhoto.value = true
  try {
    const updated = await service.uploadPhoto(driver.id, photoFile.value)
    if (updated?.photoUrl) driver.photoUrl = updated.photoUrl
    photoFile.value = null
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
  } catch (err) {
    errors.value = [err?.friendlyMessage || err?.data?.message || err?.message || 'No se pudo subir la foto']
  } finally {
    uploadingPhoto.value = false
  }
}

async function resolveDriver() {
  const user = getCurrentUser()
  const existingId = getDriverId()
  if (existingId) return service.getById(existingId)
  if (user.id) {
    const data = await service.getDriverByUserId(user.id)
    saveCurrentUser({ ...user, driverId: data.id })
    return data
  }
  throw new Error('No hay usuario autenticado')
}

async function load() {
  loading.value = true
  loadError.value = ''
  success.value = false
  try {
    Object.assign(driver, new Driver(await resolveDriver()))
  } catch (err) {
    loadError.value = err?.friendlyMessage || err?.data?.message || err?.message || 'No se pudo cargar el perfil'
  } finally {
    loading.value = false
  }
}

async function save() {
  errors.value = DriverValidator.validateEditable(driver)
  success.value = false
  if (errors.value.length) return

  saving.value = true
  try {
    const profile = await service.updateDriver(driver.id, driver)
    const vehicle = await service.updateVehicle(driver.id, driver)
    Object.assign(driver, new Driver({ ...profile, ...vehicle }))
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
  } catch (err) {
    errors.value = [err?.friendlyMessage || err?.data?.message || err?.message || 'No se pudo guardar la informacion']
  } finally {
    saving.value = false
  }
}

async function toggleAvailability() {
  try {
    Object.assign(driver, new Driver(await service.toggleAvailability(driver.id)))
  } catch (err) {
    errors.value = [err?.friendlyMessage || err?.data?.message || err?.message || 'No se pudo cambiar la disponibilidad']
  }
}

onMounted(load)
</script>

<style scoped>
.driver-info-page { display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--carbon-50); }
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }
.availability-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(139,92,246,0.3);
  background: rgba(139,92,246,0.1);
  color: var(--gold-400);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  cursor: pointer;
}
.form-card { background: var(--carbon-800); border: 1px solid var(--carbon-700); border-radius: var(--radius-xl); padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { color: var(--gold-400); font-weight: 700; font-size: 0.95rem; }
.grid { display: grid; gap: 1rem; }
.grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.field span { color: var(--carbon-400); font-size: 11px; text-transform: uppercase; font-weight: 600; }
.field input, .field select { width: 100%; padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid var(--carbon-600); background: var(--carbon-900); color: var(--carbon-100); font-family: var(--font-family); }
.field input:disabled, .field select:disabled { opacity: 0.7; cursor: not-allowed; }
.field input:focus, .field select:focus { outline: none; border-color: var(--gold-500); }
.photo-block { display: flex; align-items: center; gap: 1.25rem; }
.photo-preview {
  width: 88px; height: 88px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: var(--carbon-900); border: 1px solid var(--carbon-600);
  display: flex; align-items: center; justify-content: center; color: var(--carbon-500); font-size: 28px;
}
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.photo-controls { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.hidden-file { display: none; }
.btn-photo {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--carbon-600); background: var(--carbon-900); color: var(--carbon-200);
  border-radius: var(--radius-md); padding: 8px 14px; cursor: pointer; font-family: var(--font-family);
}
.btn-photo.upload { border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.1); color: var(--gold-400); }
.btn-photo:disabled { opacity: 0.6; cursor: not-allowed; }
.photo-hint { font-size: 11px; color: var(--carbon-500); }
.state { color: var(--carbon-400); }
.error-box, .success-box { border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 13px; }
.error-box { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: var(--danger); }
.success-box { background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3); color: var(--success); }
.actions { display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--carbon-700); padding-top: 1rem; }
.btn-cancel, .btn-save { border-radius: var(--radius-md); padding: 10px 20px; cursor: pointer; font-family: var(--font-family); }
.btn-cancel { background: transparent; border: 1px solid var(--carbon-600); color: var(--carbon-300); }
.btn-save { border: none; background: var(--gradient-gold); color: var(--carbon-950); font-weight: 700; display: inline-flex; align-items: center; gap: 8px; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 14px; height: 14px; border: 2px solid var(--carbon-950); border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) { .grid.two { grid-template-columns: 1fr; } .field.full { grid-column: auto; } .page-header { flex-direction: column; } }
</style>
