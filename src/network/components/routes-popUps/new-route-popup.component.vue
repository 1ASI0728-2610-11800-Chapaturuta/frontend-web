<script setup>
import {onMounted, ref, watch, computed, reactive} from 'vue';
import {StopService} from "@/network/services/stop.service.js";
import {RouteService} from "@/network/services/route.service.js";
import NewSchedulePopup from '../schedule-popUps/new-schedule-popup.component.vue'
import { getDriverId } from "@/shared/services/session.service.js";
import { positiveNumber } from "@/shared/validation/validators.js";

// Definición de props/emits (más explícito)
const props = defineProps({
  canCreate: { type: Boolean, default: true },
  limitMessage: { type: String, default: '' }
});
const emit = defineEmits(['update:value', 'created']);

const stopService = new StopService();
const routeService = new RouteService()

// Estado reactivo
const visiblePopupRoute = ref(false);
const visiblePopupSchedule = ref(false);

const loading = ref(false);
const error = ref("");
const isLoading = ref(false);

const stops_origin = ref([]);
const stops_destination = ref([]);

// Variables para almacenar los valores seleccionados
const routeForm = ref({
  duration: null,
  price: null,
  frequency: null,
  selectedFirstStop :null,
  selectedSecondStop: null,
});

// Métodos
const addRoute = async () => {
  isLoading.value = true;
  try{

  }catch (err){

  } finally {
    isLoading.value = false;
  }
  // Resetear formulario
  resetForm()
};
const loadSelects = async () => {
  try {
    loading.value = true;
    const driverId = getDriverId();
    if (!driverId) {
      error.value = 'Primero completa tu perfil de conductor';
      stops_origin.value = [];
      return;
    }
    stops_origin.value = await stopService.getStopsForSelect(driverId);
  } catch (err) {
    error.value = 'Error al cargar paraderos';
  } finally {
    loading.value = false;
  }
}
const touched = reactive({ origin: false, destination: false, duration: false, price: false, frequency: false });
const showErrors = ref(false);

const fieldErrors = computed(() => {
  const f = routeForm.value;
  return {
    origin: f.selectedFirstStop === null ? 'Selecciona el primer paradero.' : '',
    destination: f.selectedSecondStop === null
      ? 'Selecciona el segundo paradero.'
      : (f.selectedSecondStop === f.selectedFirstStop ? 'El destino debe ser distinto al origen.' : ''),
    duration: positiveNumber(f.duration, 'La duración'),
    price: positiveNumber(f.price, 'El precio'),
    frequency: positiveNumber(f.frequency, 'La frecuencia'),
  };
});

const showErr = (field) => (touched[field] || showErrors.value) ? fieldErrors.value[field] : '';

const isFormValid = computed(() => Object.values(fieldErrors.value).every((e) => !e));

watch(() => routeForm.value.selectedFirstStop, (newValue) => {
  routeForm.value.selectedSecondStop = null;
  if (newValue) {
    stops_destination.value = stops_origin.value.filter(
        stop => stop.value !== newValue
    );
  } else {
    stops_destination.value = [];
  }
});

const resetForm = ()=>{
  routeForm.value = {
    duration: null,
    price: null,
    frequency: null,
    selectedFirstStop: null,
    selectedSecondStop: null,
  };
}

const handleContinue = () =>{
  showErrors.value = true;
  if(!isFormValid.value) return;

  visiblePopupRoute.value = false;
  visiblePopupSchedule.value = true;
}

const handleBack = () =>{
  visiblePopupRoute.value = true;
  visiblePopupSchedule.value = false;
}

onMounted(()=>{
  loadSelects();
}
)
</script>

<template>
  <div class="new-route-trigger">
    <pb-Button class="nueva-ruta-button" icon="pi pi-plus" label="Nueva ruta" :disabled="!canCreate" @click="visiblePopupRoute = true"/>
    <small v-if="!canCreate && limitMessage" class="limit-hint">
      <i class="pi pi-lock"></i> {{ limitMessage }}
    </small>
  </div>
  <pb-Dialog v-model:visible="visiblePopupRoute" modal :style="{ width: '50rem' }">
      <template #header>
        <h1 class="title">Nueva Ruta</h1>
      </template>
        <div class="form-container">
          <div class="field-block">
            <pb-IftaLabel class="labelSelectField">
              <pb-Select inputId="stop_a" v-model="routeForm.selectedFirstStop" :options="stops_origin" option-label="label" option-value="value" class="input-field" @blur="touched.origin = true"/>
              <label for="stop_a">Primer paradero</label>
            </pb-IftaLabel>
            <small v-if="showErr('origin')" class="field-error">{{ showErr('origin') }}</small>
          </div>

          <div class="field-block">
            <pb-IftaLabel class="labelSelectField">
              <pb-Select inputId="stop_b" v-model="routeForm.selectedSecondStop" :options="stops_destination" option-label="label" option-value="value" class="input-field" :disabled="!routeForm.selectedFirstStop" @blur="touched.destination = true"/>
              <label for="stop_b">Segundo paradero</label>
            </pb-IftaLabel>
            <small v-if="showErr('destination')" class="field-error">{{ showErr('destination') }}</small>
          </div>

          <div class="field-block">
            <pb-IftaLabel class="labelSelectField">
              <pb-InputNumber id="duration" v-model="routeForm.duration" class="input-field" @blur="touched.duration = true"/>
              <label for="duration">Duración (en minutos)</label>
            </pb-IftaLabel>
            <small v-if="showErr('duration')" class="field-error">{{ showErr('duration') }}</small>
          </div>

          <div class="field-block">
            <pb-IftaLabel class="labelSelectField">
              <pb-InputNumber id="price" v-model="routeForm.price" class="input-field" @blur="touched.price = true"/>
              <label for="price">Precio (soles)</label>
            </pb-IftaLabel>
            <small v-if="showErr('price')" class="field-error">{{ showErr('price') }}</small>
          </div>

          <div class="field-block">
            <pb-IftaLabel class="labelSelectField">
              <pb-InputNumber id="frequency" v-model="routeForm.frequency" class="input-field" @blur="touched.frequency = true"/>
              <label for="frequency">Frecuencia de salida (en minutos)</label>
            </pb-IftaLabel>
            <small v-if="showErr('frequency')" class="field-error">{{ showErr('frequency') }}</small>
          </div>

          <div class="button-container">
            <pb-Button label="Cancelar" icon="pi pi-times"
                       class="cancel-button"
                       @click="()=>{
                         visiblePopupRoute = false;
                         resetForm();
                       }" />
            <pb-Button label="Continuar"
                       icon="pi pi-check"
                       class="create-button"
                       @click="handleContinue"/>
          </div>
        </div>
  </pb-Dialog>
  <new-schedule-popup
    :routeInfo = "routeForm"
    v-model:visibleSchedule="visiblePopupSchedule"
    @handle-back='handleBack'
    @created="emit('created')"
  />
</template>

<style scoped>
.labelSelectField{
  --p-iftalabel-color: var(--color-slate-400);
  --p-iftalabel-focus-color: var(--color-primary);
}

.input-field {
  border-color: var(--color-off);
  --p-inputtext-focus-border-color: var(--color-primary);
  width: 100%;
}

.button-container {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.button-container button{
  width: 100%;
}

.cancel-button{
  background-color: #FFCDBA;
  border: none;
}

.cancel-button.p-button:hover{
  background-color: #f3a88c;
  border: none;
}

.create-button{
  background-color: #66e1a3;
  border: none;
}

.create-button.p-button:disabled
{
  background-color: #66e1a3;
  border: none;
}

.create-button.p-button:hover
{
  background-color: #00A652;
  border: none;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.field-block { display: flex; flex-direction: column; gap: 4px; }
.field-error { color: #e5484d; font-size: 12px; padding-left: 4px; }

.title{
  color: var(--color-primary);
  border-bottom: var(--color-primary) solid 1px;
  padding: 10px;
}

.new-route-trigger { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.limit-hint { display: inline-flex; align-items: center; gap: 5px; color: var(--gold-400, #8B5CF6); font-size: 11px; max-width: 240px; text-align: right; }
.nueva-ruta-button{
  /*Flex para centrar*/
  display: flex;
  align-items: center;

  /*Button en si*/
  background-color: var(--color-primary);

  border: none;
  border-radius: 8px;

  padding: 8px 16px;

  max-height: 40px;
  height: 100%;

  max-width: 200px;
  width: 100%;

  /*Text Format*/
  font-size: 16px;
  font-family: Poppins, sans-serif;
  color: var(--color-white);
}

.nueva-ruta-button.p-button:hover{
  cursor: pointer;
  background-color: var(--color-off);
  color: var(--color-white);
  border: none;
}
</style>
