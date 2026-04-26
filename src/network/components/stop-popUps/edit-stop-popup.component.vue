<script>
import { ref } from "vue"; //principalmente lo usamos para el atributo visible del button
import { StopService } from '@/network/services/stop.service.js';
import { useToast } from 'primevue/usetoast';
import {GeographyService} from "@/geography/services/geography.service.js";

export default {
  name: "popUpEditStop",

  setup() {
    const visiblePop = ref(false); //variable visible que controlara la aparicion del popUp

    return { visiblePop };
  },

  props: {
    stop: {
      type: Object,
      required: true
    }
  },

  emits: ['update:value', 'updated'],

  data() {
    return {
      paradero: {
        id: '',
        name: '',
        phone: '',
        address: '',
        reference: '',
        fk_id_district: 0
      },
      initialParadero: null,
      locationHierarchy: [],
      selectedLocality: null,
      submitted: false
    };
  },
  computed: {
    isFormValid() {
      return this.paradero.name &&
          this.paradero.phone &&
          this.paradero.address &&
          this.paradero.reference &&
          this.paradero.fk_id_district;
    },
    hasChanges() {
      if (!this.initialParadero) return false;
      return JSON.stringify(this.paradero) !== JSON.stringify(this.initialParadero);
    }
  },
  methods: {
    async loadDropdowns() {
      try {
        const service = new GeographyService();
        this.locationHierarchy = await service.getFullHierarchy();
      } catch (err) {
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al cargar opciones: ${err.message}`,
          life: 3000
        });
      }
    },

    async updateStop() {
      this.submitted = true;
      if (!this.isFormValid) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Por favor completa todos los campos requeridos',
          life: 3000
        });
        return;
      }
      try {
        // Obtener companyId del localStorage y setearlo en paradero
        const user = JSON.parse(localStorage.getItem('user'));
        this.paradero.fk_id_company = user?.companyId || '';

        const service = new StopService();
        const updated = await service.updateStop(this.paradero.id, this.paradero);
        this.$emit('updated', updated);
        this.$toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Paradero actualizado correctamente',
          life: 3000
        });
        this.visiblePop = false;
        this.initializeForm();
        this.submitted = false;
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al actualizar paradero: ${err.message}`,
          life: 3000
        });
      }
    },
    initializeForm() {
      this.paradero = {
        id: this.stop.id,
        name: this.stop.name || '',
        phone: this.stop.phone || '',
        address: this.stop.address || '',
        reference: this.stop.reference || '',
        fk_id_district: this.stop.fk_id_district || '',
        fk_id_company: this.stop.fk_id_company || '',
      };
      this.initialParadero = { ...this.paradero };
    }
  },
  watch: {
    stop: {
      immediate: true,
      handler() {
        if (this.stop) {
          this.initializeForm();
          this.loadDropdowns();
        }
      }
    }
  }
};

</script>

<template>
  <pb-Button class="edit-button" icon="pi pi-pencil" @click="visiblePop = true"/>

  <pb-Dialog v-model:visible="visiblePop" header="Editar Paradero" :modal="true" :style="{ width: '50rem' }">

    <template #header>
      <h1 class="title">Editar Paradero</h1>
    </template>

    <pb-Form @submit="updateStop">

      <div class="form-container">
        <pb-IftaLabel class="labelSelectField">
          <label for="name">Nombre</label>
          <pb-InputText id="name" v-model="paradero.name" class="input-field"/>
        </pb-IftaLabel>

        <pb-IftaLabel class="labelSelectField">
          <label for="phone">Teléfono</label>
          <pb-InputText id="phone" v-model="paradero.phone" class="input-field"/>
        </pb-IftaLabel>

        <pb-IftaLabel class="labelSelectField">
          <label for="address">Dirección</label>
          <pb-InputText id="address" v-model="paradero.address" placeholder="Ej. Av. Norte 789" class="input-field"/>
        </pb-IftaLabel>

        <pb-IftaLabel class="labelSelectField">
          <label for="reference">Referencia</label>
          <pb-InputText id="reference" v-model="paradero.reference" placeholder="Ej. Frente al Teatro" class="input-field"/>
        </pb-IftaLabel>

        <pb-IftaLabel class="labelSelectField">
          <pb-CascadeSelect class="cascade-field" inputId="district" v-model="paradero.fk_id_district" :options="locationHierarchy" option-label="name" option-value="id" option-group-label="name" :option-group-children="['provinces', 'districts']"  placeholder="Selecciona la ubicación"/>
          <label for="district">Distrito</label>
        </pb-IftaLabel>

<!--
    EL FK DEL COMPANY VIENE DE LA SESION

    <div class="p-field">
          <label for="company">Empresa</label>
          <pb-Select id="company" v-model="paradero.fk_id_company" :options="companies" option-label="label" option-value="value" :class="{ 'p-invalid': !paradero.fk_id_company && submitted }" />
          <small v-if="!paradero.fk_id_company && submitted" class="p-error">La empresa es obligatoria</small>
        </div>-->

        <div class="button-container">
          <pb-Button label="Cancelar" icon="pi pi-times" class="cancel-button" @click="visiblePop = false" />
          <pb-Button label="Guardar Cambios" class="save-button" icon="pi pi-check" type="submit" :disabled="!isFormValid || !hasChanges || submitted" />
        </div>
      </div>
    </pb-Form>
  </pb-Dialog>

</template>

<style scoped>

.title{
  color: #7A78FF;
  border-bottom: #7A78FF solid 1px;
  padding: 10px;
}

.cascade-field {
  border-color: #CCCCFF;
  --p-cascadeselect-focus-border-color: #7A78FF;
}

.labelSelectField{
  --p-iftalabel-color: #484848;
  --p-iftalabel-focus-color: #7A78FF;
}

.input-field {
  border-color: #CCCCFF;
  --p-inputtext-focus-border-color: #7A78FF;
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

.save-button{
  background-color: #66e1a3;
  border: none;
}

.save-button.p-button:disabled
{
  background-color: #66e1a3;
  border: none;
}

.save-button.p-button:hover
{
  background-color: #00A652;
  border: none;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.edit-button{
  background-color: #478BFF;
  border-color: transparent;
}

.edit-button.p-button:hover{
  background-color: lightblue;
  border-color: transparent;
}



</style>