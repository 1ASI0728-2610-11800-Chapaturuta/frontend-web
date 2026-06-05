<template>
  <div class="onb-page">
    <div class="onb-card">
      <h2 class="title">Completa tu perfil de <span class="lila">conductor</span></h2>
      <p class="subtitle">Estos datos son los que verán los pasajeros y se usan para tus rutas y tarifas.</p>

      <form @submit.prevent="handleConductorRegister" novalidate>

        <!-- Datos personales -->
        <h3 class="section">Datos personales</h3>

        <div class="form-row">
          <div class="field">
            <label>Nombres</label>
            <input type="text" v-model.trim="form.firstName" class="input" required />
            <small class="hint">Tomado de tu registro. Puedes corregirlo.</small>
          </div>
          <div class="field">
            <label>Apellidos</label>
            <input type="text" v-model.trim="form.lastName" class="input" required />
            <small class="hint">Tomado de tu registro. Puedes corregirlo.</small>
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>DNI</label>
            <input type="text" v-model.trim="form.documentNumber" maxlength="8" inputmode="numeric" class="input" required />
            <small class="hint">8 dígitos numéricos.</small>
          </div>
          <div class="field">
            <label>Teléfono</label>
            <input type="tel" v-model.trim="form.phone" inputmode="numeric" class="input" required />
            <small class="hint">Celular de contacto (9 a 15 dígitos).</small>
          </div>
        </div>

        <!-- Foto -->
        <div class="field">
          <label>Foto de perfil <span class="opt">(opcional)</span></label>
          <div class="photo-row">
            <div class="photo-preview" :class="{ empty: !isValidPhotoUrl }">
              <img v-if="isValidPhotoUrl" :src="form.photoUrl" alt="preview" @error="form.photoUrl = ''" />
              <i v-else class="pi pi-user"></i>
            </div>
            <input type="url" v-model.trim="form.photoUrl" class="input" placeholder="https://ejemplo.com/mi-foto.jpg" maxlength="500" />
          </div>
          <small class="hint">Pega el enlace (URL) de una imagen ya alojada — máx 500 caracteres. La subida de archivo desde tu equipo aún no está disponible para conductores.</small>
        </div>

        <!-- Licencia -->
        <h3 class="section">Licencia de conducir</h3>
        <div class="form-row">
          <div class="field">
            <label>N° de licencia</label>
            <input type="text" v-model.trim="form.licenseNumber" class="input" required />
            <small class="hint">El número impreso en tu brevete.</small>
          </div>
          <div class="field">
            <label>Categoría</label>
            <select v-model="form.licenseCategory" class="input" required>
              <option v-for="cat in LICENSE_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
            <small class="hint">Categoría del brevete. Para pasajeros suele ser AIIb / AIIIb.</small>
          </div>
        </div>

        <!-- Vehiculo -->
        <h3 class="section">Datos del vehículo</h3>
        <div class="form-row">
          <div class="field">
            <label>Placa</label>
            <input type="text" v-model.trim="form.vehicle.plate" class="input" required />
            <small class="hint">Placa de rodaje (ej. ABC-123).</small>
          </div>
          <div class="field">
            <label>Tipo de vehículo</label>
            <select v-model="form.vehicle.type" class="input" required>
              <option v-for="vt in VEHICLE_TYPES" :key="vt" :value="vt">{{ vehicleTypeLabel(vt) }}</option>
            </select>
            <small class="hint">Clase de tu unidad.</small>
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Marca <span class="opt">(opcional)</span></label>
            <input type="text" v-model.trim="form.vehicle.brand" class="input" placeholder="Toyota, Nissan…" />
          </div>
          <div class="field">
            <label>Modelo <span class="opt">(opcional)</span></label>
            <input type="text" v-model.trim="form.vehicle.model" class="input" placeholder="Hiace, Urvan…" />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>Año del vehículo</label>
            <input type="number" v-model.number="form.vehicle.year" :max="currentYear" min="1980" class="input" required />
            <small class="hint">Año de fabricación (1980 o posterior).</small>
          </div>
          <div class="field">
            <label>Capacidad de pasajeros</label>
            <input type="number" v-model.number="form.vehicle.capacity" min="1" class="input" required />
            <small class="hint">Número de asientos disponibles para pasajeros.</small>
          </div>
        </div>

        <div v-if="error" class="banner err-banner">{{ error }}</div>
        <div v-if="success" class="banner ok-banner">{{ success }}</div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Procesando…' : 'Registrarme como conductor' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { APP_ROUTES } from "@/shared/services/routes.js";
import { ConductorService } from "@/conductor/services/conductor.service.js";
import { ConductorAssembler } from "@/conductor/services/conductor.assembler.js";
import { ConductorValidator } from "@/conductor/services/ConductorValidator.js";

const VEHICLE_TYPE_LABELS = {
  Car: 'Automóvil',
  Pickup: 'Camioneta',
  Combi: 'Combi',
  Van: 'Van',
  Bus: 'Bus',
  Minivan: 'Minivan'
};

export default {
  name: 'ConductorOnboardingView',
  data() {
    return {
      LICENSE_CATEGORIES: ConductorValidator.LICENSE_CATEGORIES,
      VEHICLE_TYPES: ConductorValidator.VEHICLE_TYPES,
      currentYear: new Date().getFullYear(),
      form: {
        firstName: '',
        lastName: '',
        documentNumber: '',
        phone: '',
        photoUrl: '',
        licenseNumber: '',
        licenseCategory: 'AIIb',
        vehicle: {
          plate: '',
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          capacity: 1,
          type: 'Combi'
        }
      },
      error: null,
      success: null,
      isLoading: false
    }
  },
  computed: {
    // Solo intentamos previsualizar si parece una URL http(s) válida.
    isValidPhotoUrl() {
      return /^https?:\/\/.+/i.test(this.form.photoUrl || '');
    }
  },
  created() {
    // Pre-llenar nombre/apellido desde el registro para no pedirlos dos veces.
    try {
      const reg = JSON.parse(localStorage.getItem('registeredUser') || '{}');
      if (reg.firstName) this.form.firstName = reg.firstName;
      if (reg.lastName) this.form.lastName = reg.lastName;
    } catch { /* noop */ }
  },
  methods: {
    vehicleTypeLabel(type) {
      return VEHICLE_TYPE_LABELS[type] ?? type;
    },
    async handleConductorRegister() {
      this.error = null;
      this.success = null;

      const errors = ConductorValidator.validate(this.form);
      if (errors.length > 0) {
        this.error = errors.join(' • ');
        return;
      }

      this.isLoading = true;
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData || !userData.id) {
          this.error = 'No se pudo obtener información del usuario. Inicia sesión de nuevo.';
          return;
        }

        const resource = ConductorAssembler.fromEntityToResource({
          ...this.form,
          fkIdUser: userData.id
        });

        const service = new ConductorService();
        const response = await service.create(resource);

        localStorage.setItem('user', JSON.stringify({
          ...userData,
          driverId: response.id
        }));

        this.success = 'Conductor registrado exitosamente';
        this.$emit('register-success');

        setTimeout(() => {
          this.$router.push(`/${APP_ROUTES.CONDUCTOR.ROOT}/${APP_ROUTES.CONDUCTOR.HOME}`);
        }, 1200);

      } catch (error) {
        console.error('Error al registrar conductor:', error);
        if (error.data?.message) {
          this.error = error.data.message;
        } else if (error.status) {
          this.error = 'Error del servidor al registrar el conductor.';
        } else {
          this.error = 'Error de conexión. Verifica tu conexión a internet.';
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.onb-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  background: linear-gradient(180deg, var(--surface) 0%, var(--lilac-100) 100%);
}

.onb-card {
  background: var(--surface);
  padding: 2rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--carbon-700);
  box-shadow: var(--shadow-elevated);
  width: 100%;
  max-width: 560px;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.02em;
}
.title .lila { color: var(--gold-600); }
.subtitle {
  color: var(--carbon-400);
  margin: 0.4rem 0 1.25rem;
  font-size: 0.9rem;
}

.section {
  text-align: left;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ink);
  margin: 1.25rem 0 0.75rem;
  border-top: 1px solid var(--carbon-700);
  padding-top: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}
@media (max-width: 520px) { .form-row { grid-template-columns: 1fr; } }

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 0.9rem;
}
.field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--carbon-300);
}
.field .opt { color: var(--carbon-400); font-weight: 400; }

.input {
  width: 100%;
  padding: 0.7rem 0.85rem;
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  color: var(--ink);
  font-size: 0.95rem;
  font-family: var(--font-family);
  outline: none;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.input:focus { border-color: var(--gold-500); box-shadow: 0 0 0 2px rgba(183,166,224,0.18); }

.hint { font-size: 11px; color: var(--carbon-400); }
.err  { font-size: 11px; color: var(--danger); }

/* Foto */
.photo-row { display: flex; align-items: center; gap: 14px; }
.photo-row .input { flex: 1; }
.photo-preview {
  width: 56px; height: 56px;
  border-radius: 50%;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--lilac-100);
  border: 1px solid var(--carbon-700);
  flex-shrink: 0;
}
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.photo-preview.empty i { color: var(--gold-600); font-size: 20px; }

/* Banners */
.banner { border-radius: var(--radius-md); font-size: 13px; padding: 0.6rem 0.85rem; margin: 0.75rem 0 0; text-align: left; }
.err-banner { color: var(--danger); background: rgba(226,86,107,0.1); border: 1px solid rgba(226,86,107,0.3); }
.ok-banner  { color: var(--success); background: rgba(59,174,110,0.1); border: 1px solid rgba(59,174,110,0.3); }

.btn-primary {
  width: 100%;
  padding: 0.8rem;
  margin-top: 1.25rem;
  background: var(--gradient-gold);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem; font-weight: 700;
  font-family: var(--font-family);
  cursor: pointer;
  transition: opacity var(--duration-fast) ease, box-shadow var(--duration-normal) ease;
  box-shadow: 0 4px 20px rgba(183,166,224,0.3);
}
.btn-primary:hover:not(:disabled) { opacity: 0.92; box-shadow: var(--shadow-gold); }
.btn-primary:disabled { background: var(--carbon-700); color: var(--carbon-400); cursor: not-allowed; box-shadow: none; }
</style>
