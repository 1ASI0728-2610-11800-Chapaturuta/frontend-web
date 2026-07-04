<script>
import { ref } from "vue";
import { StopService } from '@/network/services/stop.service.js';
import {GeographyService} from "@/geography/services/geography.service.js";
import MapPicker from '@/shared/components/MapPicker.vue';
import { reverseGeocode, buildAddress } from '@/shared/services/reverse-geocode.service.js';

export default {
  name: "popUpNewStop",
  components: { MapPicker },

  props: {
    canCreate: { type: Boolean, default: true },
    limitMessage: { type: String, default: '' }
  },

  setup() {
    const visiblePop = ref(false);
    const selectedImage = ref(null);
    const imagePreview = ref(null);

    return {
      visiblePop,
      selectedImage,
      imagePreview
    };
  },

  emits: ['update:value', 'created'],

  data() {
    return {
      paradero: {
        name: '',
        address: '',
        reference: '',
        fk_id_district: '',
        imageFile: null,
        latitude: null,
        longitude: null
      },
      coords: null,
      districtsFlat: [],
      districtSuggestions: [],
      selectedDistrict: null,
      submitted: false,
      isUploading: false,
      geocoding: false,
      outsidePeru: false,
      _lastGeocoded: null
    };
  },

  computed: {
    isFormValid() {
      return !this.firstValidationError;
    },
    // Devuelve el primer campo faltante con un mensaje explicativo, o '' si todo OK.
    firstValidationError() {
      if (!this.paradero.name) return 'Ingresa el nombre del paradero.';
      if (!this.paradero.address) return 'Ingresa la dirección.';
      if (!this.paradero.reference) return 'Ingresa una referencia.';
      if (!this.paradero.fk_id_district) return 'Selecciona el distrito.';
      if (!this.coords || this.coords.lat == null || this.coords.lng == null) return 'Marca la ubicación en el mapa.';
      if (this.outsidePeru) return 'La ubicación debe estar dentro de Perú.';
      return '';
    },
  },

  methods: {
    async loadDropdowns() {
      try {
        const service = new GeographyService();
        const hierarchy = await service.getFullHierarchy();
        const flat = [];
        for (const region of hierarchy) {
          for (const prov of (region.provinces || [])) {
            for (const dist of (prov.districts || [])) {
              flat.push({
                id: dist.id,
                name: dist.name,
                province: prov.name,
                region: region.name,
                label: `${dist.name} — ${prov.name}, ${region.name}`,
                _search: `${dist.name} ${prov.name} ${region.name}`.toLowerCase()
              });
            }
          }
        }
        this.districtsFlat = flat;
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al cargar opciones: ${err.message}`,
          life: 3000
        });
      }
    },

    searchDistrict(event) {
      const q = (event.query || '').trim().toLowerCase();
      if (!q) {
        this.districtSuggestions = this.districtsFlat.slice(0, 20);
        return;
      }
      const tokens = q.split(/\s+/);
      this.districtSuggestions = this.districtsFlat
        .filter(d => tokens.every(t => d._search.includes(t)))
        .slice(0, 30);
    },

    onDistrictSelect(event) {
      const v = event.value;
      this.selectedDistrict = v;
      this.paradero.fk_id_district = v?.id || '';
    },

    _normalize(str) {
      return (str || '')
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
    },

    matchDistrict(addr) {
      if (!addr) return null;
      const candidates = [
        addr.city_district,
        addr.county,
        addr.town,
        addr.village,
        addr.city,
        addr.municipality
      ];
      const raw = candidates.find(c => c && c.trim());
      if (!raw || !this.districtsFlat.length) return null;
      const target = this._normalize(raw);
      // Match exacto preferido
      const exact = this.districtsFlat.filter(d => this._normalize(d.name) === target);
      if (exact.length === 1) return exact[0];
      // Fallback a includes (en ambos sentidos)
      const partial = this.districtsFlat.filter(d => {
        const n = this._normalize(d.name);
        return n.includes(target) || target.includes(n);
      });
      return partial.length === 1 ? partial[0] : null;
    },

    async onCoordsChange(coords) {
      if (!coords || coords.lat == null || coords.lng == null) return;
      const key = `${coords.lat},${coords.lng}`;
      if (key === this._lastGeocoded) return; // evita llamadas duplicadas
      this._lastGeocoded = key;

      this.geocoding = true;
      try {
        const result = await reverseGeocode(coords.lat, coords.lng);
        if (!result || !result.address) return;

        // Validación fina de país: solo Perú (country_code === 'pe').
        const countryCode = (result.country_code ?? result.address?.country_code ?? '').toLowerCase();
        if (countryCode && countryCode !== 'pe') {
          this.outsidePeru = true;
          this.coords = null;
          this.paradero.latitude = null;
          this.paradero.longitude = null;
          this.selectedDistrict = null;
          this.paradero.fk_id_district = '';
          this.$toast.add({
            severity: 'error',
            summary: 'Ubicación inválida',
            detail: 'Solo puedes crear paraderos dentro de Perú.',
            life: 4000
          });
          return;
        }
        this.outsidePeru = false;

        const address = buildAddress(result.address);
        if (address) {
          this.paradero.address = address;
        }

        const match = this.matchDistrict(result.address);
        if (match) {
          this.selectedDistrict = match;
          this.paradero.fk_id_district = match.id;
        }
      } catch (err) {
        // Best-effort: no romper el form si Nominatim falla
        console.warn('Autorelleno por reverse-geocode falló:', err);
      } finally {
        this.geocoding = false;
      }
    },

    onImageSelect(event) {
      const file = event.target.files[0];
      if (file) {
        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Archivo no válido',
            detail: 'Solo se permiten archivos JPG, PNG o GIF',
            life: 3000
          });
          return;
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Archivo muy grande',
            detail: 'El archivo debe ser menor a 5MB',
            life: 3000
          });
          return;
        }

        this.selectedImage = file;
        this.paradero.imageFile = file;

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    removeImage() {
      this.selectedImage = null;
      this.imagePreview = null;
      this.paradero.imageFile = null;
      // Limpiar el input file
      const fileInput = this.$refs.imageInput;
      if (fileInput) {
        fileInput.value = '';
      }
    },

    onTriggerClick() {
      if (!this.canCreate) {
        this.$toast.add({ severity: 'info', summary: 'Límite del plan Básico', detail: this.limitMessage, life: 4000 });
        return;
      }
      this.visiblePop = true;
    },

    async createStop() {
      this.submitted = true;
      if (!this.isFormValid) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Falta completar',
          detail: this.firstValidationError,
          life: 3500
        });
        return;
      }

      try {
        this.isUploading = true;

        const service = new StopService();
        const payload = {
          ...this.paradero,
          latitude: this.coords?.lat,
          longitude: this.coords?.lng
        };
        const created = await service.createStop(payload);

        this.$emit('created', created);
        this.$toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Paradero creado correctamente',
          life: 3000
        });

        // Cerrar el popup y resetear formulario
        this.visiblePop = false;
        this.resetForm();

      } catch (err) {
        this.$toast.add({
          severity: 'error',
          summary: 'No se pudo crear el paradero',
          detail: err.friendlyMessage || err.message,
          life: 4000
        });
      } finally {
        this.isUploading = false;
      }
    },

    resetForm() {
      this.paradero = {
        name: '',
        address: '',
        reference: '',
        fk_id_driver: '',
        fk_id_company: '',
        fk_id_district: '',
        imageFile: null,
        latitude: null,
        longitude: null
      };
      this.coords = null;
      this._lastGeocoded = null;
      this.geocoding = false;
      this.outsidePeru = false;
      this.selectedDistrict = null;
      this.districtSuggestions = [];
      this.submitted = false;
      this.removeImage();
    },

    onDialogHide() {
      this.resetForm();
    }
  },

  watch: {
    coords: {
      handler(val) {
        this.onCoordsChange(val);
      },
      deep: true
    }
  },

  mounted() {
    this.loadDropdowns();
  }
};
</script>

<template>
  <div class="new-stop-trigger">
    <pb-Button
      class="nuevo-paradero-button"
      icon="pi pi-plus"
      label="Nuevo Paradero"
      :disabled="!canCreate"
      @click="onTriggerClick"
    />
    <small v-if="!canCreate && limitMessage" class="limit-hint">
      <i class="pi pi-lock"></i> {{ limitMessage }}
    </small>
  </div>

  <pb-Dialog v-model:visible="visiblePop" modal :style="{ width: '50rem' }" @hide="onDialogHide">
    <template #header>
      <h1 class="title">Nuevo Paradero</h1>
    </template>

    <form @submit.prevent="createStop">
      <div class="form-container">

        <!-- Campo de Nombre -->
        <pb-IftaLabel class="labelSelectField">
          <label for="name">Nombre</label>
          <pb-InputText id="name" v-model="paradero.name" class="input-field" />
        </pb-IftaLabel>

        <!-- Campo de Dirección -->
        <pb-IftaLabel class="labelSelectField">
          <label for="address">Dirección</label>
          <pb-InputText id="address" v-model="paradero.address" placeholder="Ej: Av. Norte 789" class="input-field"/>
        </pb-IftaLabel>

        <!-- Campo de Referencia -->
        <pb-IftaLabel class="labelSelectField">
          <label for="reference">Referencia</label>
          <pb-InputText id="reference" v-model="paradero.reference" placeholder="Ej: Frente al Teatro" class="input-field"/>
        </pb-IftaLabel>

        <!-- Campo de Distrito -->
        <pb-IftaLabel class="labelSelectField">
          <pb-AutoComplete
              inputId="district"
              v-model="selectedDistrict"
              :suggestions="districtSuggestions"
              option-label="label"
              :force-selection="true"
              :complete-on-focus="true"
              :delay="100"
              placeholder="Escribe nombre del distrito"
              class="autocomplete-field"
              dropdown
              @complete="searchDistrict"
              @item-select="onDistrictSelect"
          />
          <label for="district">Distrito</label>
        </pb-IftaLabel>

        <!-- Mapa para fijar coordenadas -->
        <div class="map-section">
          <label class="image-upload-label">Ubicación en el mapa <span style="color:#e57373">*</span></label>
          <MapPicker v-model="coords" height="280px" />
          <small v-if="coords" class="coords-label">Lat: {{ coords.lat }}, Lng: {{ coords.lng }}</small>
          <small v-if="geocoding" class="geocoding-label">
            <i class="pi pi-spin pi-spinner"></i> Buscando dirección...
          </small>
        </div>

        <!-- Campo de Imagen -->
        <div class="image-upload-section">
          <label class="image-upload-label">Imagen del Paradero (Opcional)</label>

          <!-- Input de archivo oculto -->
          <input
              ref="imageInput"
              type="file"
              accept="image/*"
              @change="onImageSelect"
              style="display: none"
          />

          <!-- Botón para seleccionar imagen -->
          <pb-Button
              v-if="!selectedImage"
              type="button"
              label="Seleccionar Imagen"
              icon="pi pi-upload"
              class="image-select-button"
              @click="$refs.imageInput.click()"
          />

          <!-- Preview de la imagen -->
          <div v-if="imagePreview" class="image-preview-container">
            <img :src="imagePreview" alt="Preview" class="image-preview" />
            <pb-Button
                type="button"
                icon="pi pi-times"
                class="remove-image-button"
                @click="removeImage"
                severity="danger"
                size="small"
            />
          </div>

          <!-- Información sobre el archivo -->
          <div v-if="selectedImage" class="file-info">
            <small>{{ selectedImage.name }} ({{ Math.round(selectedImage.size / 1024) }} KB)</small>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="button-container">
          <pb-Button
              label="Cancelar"
              icon="pi pi-times"
              class="cancel-button"
              type="button"
              @click="visiblePop = false"
          />
          <pb-Button
              :label="isUploading ? 'Creando...' : 'Crear'"
              :icon="isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
              class="create-button"
              type="button"
              :disabled="isUploading"
              @click="createStop"
          />
        </div>
      </div>
    </form>
  </pb-Dialog>
</template>

<style scoped>
.autocomplete-field {
  width: 100%;
}
.autocomplete-field :deep(input) { width: 100%; }

.labelSelectField{
  --p-iftalabel-color: var(--color-slate-400);
  --p-iftalabel-focus-color: var(--color-primary);
}

.input-field {
  border-color: var(--color-off);
  --p-inputtext-focus-border-color: var(--color-primary);
  width: 100%;
}

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.coords-label {
  color: var(--color-slate-400);
  font-size: 12px;
}

.geocoding-label {
  color: var(--color-primary);
  font-size: 12px;
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.image-upload-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-slate-400);
}

.image-select-button {
  background-color: #f8f9fa;
  border: 2px dashed var(--color-off);
  color: var(--color-primary);
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.image-select-button:hover {
  background-color: #e9ecef;
  border-color: var(--color-primary);
}

.image-preview-container {
  position: relative;
  display: inline-block;
  max-width: 200px;
}

.image-preview {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  border: 2px solid var(--color-off);
}

.remove-image-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  padding: 0;
  min-width: 24px;
}

.file-info {
  color: var(--color-slate-400);
  font-size: 12px;
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
  opacity: 0.6;
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

.new-stop-trigger { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.limit-hint { display: inline-flex; align-items: center; gap: 5px; color: var(--gold-400, #8B5CF6); font-size: 11px; max-width: 240px; text-align: right; }
.nuevo-paradero-button{
  display: flex;
  align-items: center;
  background-color: var(--color-primary);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  max-height: 40px;
  height: 100%;
  max-width: 200px;
  width: 100%;
  font-size: 16px;
  font-family: Poppins, sans-serif;
  color: var(--color-white);
}

.nuevo-paradero-button.p-button:hover{
  cursor: pointer;
  background-color: var(--color-off);
  color: var(--color-white);
  border: none;
}
</style>
