<template>
  <div class="company-info-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Información de la Empresa</h1>
        <p class="page-sub">Gestiona y actualiza los datos de tu empresa de transporte</p>
      </div>
    </div>

    <div class="form-card">
      <h2 class="form-section-title">Datos Generales</h2>
      <form @submit.prevent="saveCompanyInformation" class="company-form" novalidate>

        <div class="fields-row">
          <div class="field-group">
            <label for="companyName">Nombre de la Empresa <span class="req">*</span></label>
            <input id="companyName" v-model="companyInfo.name" type="text" required placeholder="Nombre de la empresa" />
          </div>
          <div class="field-group">
            <label for="ruc">RUC <span class="req">*</span></label>
            <input id="ruc" v-model="companyInfo.ruc" type="text" required maxlength="11" placeholder="20123456789" />
          </div>
        </div>

        <div class="fields-row">
          <div class="field-group">
            <label for="phone">Teléfono <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-phone input-icon"></i>
              <input id="phone" v-model="companyInfo.phone" type="tel" required placeholder="+51 999 999 999" />
            </div>
          </div>
          <div class="field-group">
            <label for="email">Email <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-envelope input-icon"></i>
              <input id="email" v-model="companyInfo.email" type="email" required placeholder="empresa@ejemplo.com" />
            </div>
          </div>
        </div>

        <div class="field-group">
          <label for="address">Dirección <span class="req">*</span></label>
          <textarea id="address" v-model="companyInfo.address" required rows="3" placeholder="Dirección completa de la empresa"></textarea>
        </div>

        <div class="field-group">
          <label for="description">Descripción</label>
          <textarea id="description" v-model="companyInfo.description" rows="4" placeholder="Descripción de la empresa y sus servicios"></textarea>
        </div>

        <transition name="fade">
          <div v-if="showSuccess" class="success-banner">
            <i class="pi pi-check-circle"></i>
            Información guardada exitosamente
          </div>
        </transition>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="resetForm">Cancelar</button>
          <button type="submit" class="btn-save" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { TransportCompany } from "@/transport-company/models/transport-company.entity.js"
import { TransportCompanyService } from "@/transport-company/services/transport-company.service.js"
import { TransportCompanyValidator } from "@/transport-company/services/TransportCompanyValidator.js"

const transportCompanyService = new TransportCompanyService()
const companyInfo   = reactive(new TransportCompany({}))
const isLoading     = ref(false)
const showSuccess   = ref(false)

const getCompanyId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.companyId || 'comp-1'
}

const saveCompanyInformation = async () => {
  const errors = TransportCompanyValidator.validate(companyInfo)
  if (errors.length > 0) {
    alert(`Por favor corrija:\n\n${errors.map(e => `• ${e}`).join('\n')}`)
    return
  }
  try {
    isLoading.value = true
    const id = getCompanyId()
    await transportCompanyService.updateTransportCompany(id, new TransportCompany({ ...companyInfo, id }))
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  } catch (err) {
    console.error('Save error:', err)
  } finally {
    isLoading.value = false
  }
}

const loadCompanyInformation = async () => {
  try {
    const data = await transportCompanyService.getTransportCompanyById(getCompanyId())
    Object.assign(companyInfo, {
      name: data.name, logo_url: data.logo_url, ruc: data.ruc,
      phone: data.phone, email: data.email, address: data.address, description: data.description
    })
  } catch (err) {
    console.error('Load error:', err)
  }
}

const resetForm = () => loadCompanyInformation()

onMounted(loadCompanyInformation)
</script>

<style scoped>
.company-info-page { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--carbon-50);
  letter-spacing: -0.02em;
}
.page-sub { font-size: 0.875rem; color: var(--carbon-400); margin-top: 4px; }

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

.company-form { display: flex; flex-direction: column; gap: 1rem; }
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
.field-group textarea {
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
  resize: vertical;
  box-sizing: border-box;
}
.input-wrap input { padding-left: 36px; }
.field-group input::placeholder,
.field-group textarea::placeholder { color: var(--carbon-500); }
.field-group input:focus,
.field-group textarea:focus { border-color: var(--gold-500); box-shadow: 0 0 0 2px rgba(201,168,76,0.15); }

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
.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--carbon-600);
  border-radius: var(--radius-md);
  color: var(--carbon-300);
  font-size: 14px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: border-color var(--duration-fast) ease;
}
.btn-cancel:hover { border-color: var(--carbon-400); }
.btn-save {
  padding: 10px 24px;
  background: var(--gradient-gold);
  border: none;
  border-radius: var(--radius-md);
  color: var(--carbon-950);
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
  border: 2px solid var(--carbon-950);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
