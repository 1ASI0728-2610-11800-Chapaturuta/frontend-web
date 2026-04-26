<script setup>
import {onMounted, ref, watch, computed} from 'vue';
import {StopService} from "@/network/services/stop.service.js";
import {RouteService} from "@/network/services/route.service.js";
import NewSchedulePopup from '../schedule-popUps/new-schedule-popup.component.vue'

// Definición de props/emits (más explícito)
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
    const user = JSON.parse(localStorage.getItem("user"));
    console.log(user);
    await stopService.getStopsForSelect(user.companyId); // revisar el company Id, deber ser int, por mientras esta con 2
                                                                      //Recuerda crear un company en el swagger para que funcione
  } catch (err) {
    error.value = 'Error al cargar paraderos';
  } finally {
    loading.value = false;
  }
}
const isFormValid = computed(() => {
  const form = routeForm.value;
  return (
      form.duration > 0 &&
      form.price > 0 &&
      form.frequency > 0 &&
      form.selectedFirstStop !== null &&
      form.selectedSecondStop !== null
  );
});

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
  <pb-Button class="nueva-ruta-button" icon="pi pi-plus" label="Nueva ruta" @click="visiblePopupRoute = true"/>
  <pb-Dialog v-model:visible="visiblePopupRoute" modal :style="{ width: '50rem' }">
      <template #header>
        <h1 class="title">Editar Ruta</h1>
      </template>
        <div class="form-container">
          <pb-IftaLabel class="labelSelectField">
            <pb-Select inputId="stop_a" v-model="routeForm.selectedFirstStop" :options="stops_origin" option-label="label" option-value="value" class="input-field"/>
            <label for="stop_a">Primer paradero</label>
          </pb-IftaLabel>
          <pb-IftaLabel class="labelSelectField">
            <pb-Select inputId="stop_b" v-model="routeForm.selectedSecondStop" :options="stops_destination" option-label="label" option-value="value" class="input-field" :disabled="!routeForm.selectedFirstStop"/>
            <label for="stop_b">Segundo paradero</label>
          </pb-IftaLabel>

          <pb-IftaLabel class="labelSelectField">
            <pb-InputNumber id="duration" v-model="routeForm.duration" class="input-field"/>
            <label for="duration">Duración (en minutos)</label>
          </pb-IftaLabel>

          <pb-IftaLabel class="labelSelectField">
            <pb-InputNumber id="price" v-model="routeForm.price" class="input-field"/>
            <label for="price">Precio (soles)</label>
          </pb-IftaLabel>

          <pb-IftaLabel class="labelSelectField">
            <pb-InputNumber id="frequency" v-model="routeForm.frequency" class="input-field"/>
            <label for="frequency">Frecuencia de salida (en minutos)</label>
          </pb-IftaLabel>

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
                       :disabled="!isFormValid"
                       @click="handleContinue"/>
<!-- :disabled="!isFormValid && !submitted"            -->
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
  gap: 30px;
}

.title{
  color: var(--color-primary);
  border-bottom: var(--color-primary) solid 1px;
  padding: 10px;
}

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