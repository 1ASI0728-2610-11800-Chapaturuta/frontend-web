<template>
  <div class="admin-plans-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Gestión de <span class="accent">Planes</span></h1>
        <p class="page-sub">Crea y administra los planes de suscripción de la plataforma</p>
      </div>
      <pb-Button label="Nuevo plan" icon="pi pi-plus" @click="openCreate" />
    </header>

    <pb-Message v-if="errorMsg" severity="error" :closable="true" @close="errorMsg = ''">
      {{ errorMsg }}
    </pb-Message>
    <pb-Message v-if="successMsg" severity="success" :closable="true" @close="successMsg = ''">
      {{ successMsg }}
    </pb-Message>

    <div class="table-card">
      <pb-DataTable
          :value="plans"
          :loading="isLoading"
          dataKey="id"
          paginator
          :rows="8"
          stripedRows
          responsiveLayout="scroll"
      >
        <template #empty>No hay planes registrados.</template>
        <template #loading>Cargando planes...</template>

        <pb-Column field="name" header="Nombre" sortable />
        <pb-Column field="planType" header="Tipo" sortable>
          <template #body="{ data }">
            <span class="type-pill" :class="data.planType === 'Premium' ? 'type-premium' : 'type-free'">
              {{ data.planType }}
            </span>
          </template>
        </pb-Column>
        <pb-Column field="targetRole" header="Rol objetivo" sortable />
        <pb-Column header="Precio">
          <template #body="{ data }">{{ formatPrice(data) }}</template>
        </pb-Column>
        <pb-Column field="billingCycle" header="Ciclo" sortable>
          <template #body="{ data }">{{ data.billingCycle === 'Yearly' ? 'Anual' : 'Mensual' }}</template>
        </pb-Column>
        <pb-Column header="Discovery">
          <template #body="{ data }">
            {{ data.discoveryQuota == null ? 'Ilimitado' : data.discoveryQuota }}
          </template>
        </pb-Column>
        <pb-Column field="isActive" header="Estado" sortable>
          <template #body="{ data }">
            <span class="status-pill" :class="data.isActive ? 'status-on' : 'status-off'">
              {{ data.isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </template>
        </pb-Column>
        <pb-Column header="Acciones" :exportable="false" style="width: 6rem">
          <template #body="{ data }">
            <pb-Button icon="pi pi-pencil" text rounded aria-label="Editar" @click="openEdit(data)" />
          </template>
        </pb-Column>
      </pb-DataTable>
    </div>

    <!-- Dialogo de crear / editar -->
    <pb-Dialog
        v-model:visible="dialogVisible"
        modal
        :header="isEditing ? 'Editar plan' : 'Crear plan'"
        :style="{ width: '34rem' }"
    >
      <form class="plan-form" @submit.prevent="save">
        <div class="form-row">
          <div class="field">
            <label>Nombre <span class="req">*</span></label>
            <pb-InputText v-model="form.name" :disabled="isEditing" placeholder="Ej. Premium Viajero" />
          </div>
          <div class="field">
            <label>Tipo de plan <span class="req">*</span></label>
            <pb-Select v-model="form.planType" :options="PLAN_TYPES" :disabled="isEditing" placeholder="Tipo" />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Rol objetivo <span class="req">*</span></label>
            <pb-Select v-model="form.targetRole" :options="TARGET_ROLES" :disabled="isEditing" placeholder="Rol" />
          </div>
          <div class="field">
            <label>Ciclo de facturación <span class="req">*</span></label>
            <pb-Select v-model="form.billingCycle" :options="BILLING_CYCLES" :disabled="isEditing" placeholder="Ciclo" />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Precio <span class="req">*</span></label>
            <pb-InputNumber v-model="form.price" :min="0" :minFractionDigits="2" :maxFractionDigits="2" mode="decimal" />
          </div>
          <div class="field">
            <label>Moneda</label>
            <pb-InputText v-model="form.currency" :disabled="isEditing" placeholder="PEN" />
          </div>
        </div>

        <div class="field">
          <label>Cuota Discovery (vacío = ilimitado)</label>
          <pb-InputNumber v-model="form.discoveryQuota" :min="0" showButtons placeholder="Ilimitado" />
        </div>

        <div class="field">
          <label>Beneficios <span class="req">*</span></label>
          <textarea
              v-model="form.benefits"
              class="benefits-area"
              rows="4"
              placeholder="Un beneficio por línea"
          ></textarea>
          <small class="hint">Escribe un beneficio por línea; se mostrarán como lista.</small>
        </div>

        <div v-if="isEditing" class="field field-inline">
          <label class="switch-label">
            <input type="checkbox" v-model="form.isActive" />
            <span>Plan activo</span>
          </label>
        </div>
      </form>

      <template #footer>
        <pb-Button label="Cancelar" text @click="dialogVisible = false" />
        <pb-Button :label="isEditing ? 'Guardar cambios' : 'Crear plan'" :loading="busy" @click="save" />
      </template>
    </pb-Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plan } from '@/subscriptions/models/plan.entity.js';
import { PlanService } from '@/subscriptions/services/plan.service.js';

const PLAN_TYPES = ['Free', 'Premium'];
const TARGET_ROLES = ['Traveller', 'Driver', 'Both'];
const BILLING_CYCLES = ['Monthly', 'Yearly'];

const planService = new PlanService();

const plans = ref([]);
const isLoading = ref(false);
const busy = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const emptyForm = () => ({
  name: '',
  planType: 'Free',
  targetRole: 'Both',
  price: 0,
  currency: 'PEN',
  billingCycle: 'Monthly',
  benefits: '',
  discoveryQuota: null,
  isActive: true
});

const form = reactive(emptyForm());

const formatPrice = (plan) => {
  if (Number(plan.price) === 0) return 'Gratis';
  return `${plan.currency} ${Number(plan.price).toFixed(2)}`;
};

const flashError = (msg) => { errorMsg.value = msg; setTimeout(() => { errorMsg.value = ''; }, 4000); };
const flashSuccess = (msg) => { successMsg.value = msg; setTimeout(() => { successMsg.value = ''; }, 4000); };

const loadPlans = async () => {
  isLoading.value = true;
  try {
    const data = await planService.getAll();
    plans.value = (data || []).map(p => new Plan(p));
  } catch (err) {
    flashError('No se pudieron cargar los planes.');
    console.error('Load plans error:', err);
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => Object.assign(form, emptyForm());

const openCreate = () => {
  isEditing.value = false;
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (plan) => {
  isEditing.value = true;
  editingId.value = plan.id;
  Object.assign(form, {
    name: plan.name,
    planType: plan.planType,
    targetRole: plan.targetRole,
    price: plan.price,
    currency: plan.currency,
    billingCycle: plan.billingCycle,
    benefits: plan.benefits,
    discoveryQuota: plan.discoveryQuota,
    isActive: plan.isActive
  });
  dialogVisible.value = true;
};

const validate = () => {
  if (!form.name?.trim()) return 'El nombre es obligatorio.';
  if (form.price == null || form.price < 0) return 'El precio debe ser válido.';
  if (!form.benefits?.trim()) return 'Los beneficios son obligatorios.';
  return null;
};

const save = async () => {
  const error = validate();
  if (error) { flashError(error); return; }

  busy.value = true;
  try {
    if (isEditing.value) {
      // UpdatePlanResource: { price, benefits, discoveryQuota, isActive }
      await planService.update(editingId.value, {
        price: form.price,
        benefits: form.benefits,
        discoveryQuota: form.discoveryQuota,
        isActive: form.isActive
      });
      flashSuccess('Plan actualizado.');
    } else {
      // CreatePlanResource: { name, planType, targetRole, price, currency, billingCycle, benefits, discoveryQuota }
      await planService.create({
        name: form.name,
        planType: form.planType,
        targetRole: form.targetRole,
        price: form.price,
        currency: form.currency || 'PEN',
        billingCycle: form.billingCycle,
        benefits: form.benefits,
        discoveryQuota: form.discoveryQuota
      });
      flashSuccess('Plan creado.');
    }
    dialogVisible.value = false;
    await loadPlans();
  } catch (err) {
    flashError(err?.data?.message || 'No se pudo guardar el plan.');
    console.error('Save plan error:', err);
  } finally {
    busy.value = false;
  }
};

onMounted(loadPlans);
</script>

<style scoped>
.admin-plans-page { display: flex; flex-direction: column; gap: 1.5rem; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-title { font-size: 1.6rem; font-weight: 700; color: var(--carbon-50); letter-spacing: -0.02em; }
.page-title .accent { color: var(--gold-600); }
.page-sub { font-size: 0.9rem; color: var(--carbon-400); margin-top: 4px; }

.table-card {
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  padding: 0.5rem;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.type-pill, .status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.type-premium { background: var(--gold-100); color: var(--gold-600); }
.type-free { background: var(--carbon-700); color: var(--carbon-300); }
.status-on { background: rgba(59,174,110,0.12); color: var(--success); }
.status-off { background: rgba(226,86,107,0.12); color: var(--danger); }

/* Formulario */
.plan-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 560px) { .form-row { grid-template-columns: 1fr; } }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-size: 11px;
  font-weight: 600;
  color: var(--carbon-400);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.req { color: var(--danger); }
.hint { font-size: 11px; color: var(--carbon-500); }

.field :deep(.p-inputtext),
.field :deep(.p-select),
.field :deep(.p-inputnumber) { width: 100%; }

.benefits-area {
  width: 100%;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--carbon-600);
  border-radius: var(--radius-md);
  color: var(--carbon-100);
  font-size: 14px;
  font-family: var(--font-family);
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--duration-fast) ease;
}
.benefits-area:focus { border-color: var(--gold-500); box-shadow: 0 0 0 2px rgba(183,166,224,0.15); }

.field-inline { flex-direction: row; align-items: center; }
.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--carbon-200);
  text-transform: none;
  letter-spacing: normal;
  cursor: pointer;
}
.switch-label input { width: 16px; height: 16px; accent-color: var(--gold-500); cursor: pointer; }
</style>
