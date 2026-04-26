<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="title">Empresa</h2>
      <p class="subtitle">Ingresa la información de su empresa</p>

      <form @submit.prevent="handleCompanyRegister">
        <div class="logo-upload-container">
          <div class="logo-upload" @click="triggerFileInput">
            <input
                type="file"
                ref="fileInput"
                @change="handleFileChange"
                accept="image/*"
                style="display: none"
            />
            <div v-if="!previewImage" class="upload-placeholder">
              <span class="upload-icon">📷</span>
              <span>Suba el logo de su empresa</span>
            </div>
            <img v-else :src="previewImage" alt="Logo preview" class="preview-image" />
          </div>

          <!-- Mostrar información del archivo seleccionado -->
          <div v-if="companyLogo" class="file-info">
            <p class="file-name">{{ companyLogo.name }}</p>
            <p class="file-size">{{ formatFileSize(companyLogo.size) }}</p>
            <button type="button" @click="removeFile" class="remove-file-btn">
              ✕ Remover archivo
            </button>
          </div>
        </div>

        <div class="form-group">
          <input
              type="text"
              v-model="companyName"
              placeholder="Nombre de su empresa"
              class="form-input"
              required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          {{ success }}
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Procesando...' : 'Continuar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import {APP_ROUTES} from "@/shared/services/routes.js";
import {TransportCompanyService} from "@/transport-company/services/transport-company.service.js";

export default {
  name: 'CompanyRegisterView',
  data() {
    return {
      companyName: '',
      companyLogo: null,
      previewImage: null,
      error: null,
      success: null,
      isLoading: false
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          this.error = 'Por favor seleccione un archivo de imagen válido';
          return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.error = 'El archivo es demasiado grande. Máximo 5MB permitido';
          return;
        }

        this.companyLogo = file;
        this.previewImage = URL.createObjectURL(file);
        this.error = null;
      }
    },

    removeFile() {
      this.companyLogo = null;
      this.previewImage = null;
      this.$refs.fileInput.value = '';
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async handleCompanyRegister() {
      if (!this.companyName.trim()) {
        this.error = 'Por favor ingrese el nombre de su empresa';
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.success = null;

      try {
        // Obtener datos del usuario desde localStorage
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!userData || !userData.id) {
          this.error = 'No se pudo obtener información del usuario';
          return;
        }

        // Preparar datos para enviar
        const companyData = {
          name: this.companyName.trim(),
          fkIdUser: userData.id,
          logoFile: this.companyLogo // Enviar el archivo directamente
        };

        const transportCompanyService = new TransportCompanyService();

        // Llamar al nuevo método que maneja FormData
        const response = await transportCompanyService.createCompany(companyData);

        // Actualizar localStorage con la información de la empresa
        localStorage.setItem('user', JSON.stringify({
          ...userData,
          companyId: response.id
        }));

        this.success = 'Empresa registrada exitosamente';

        console.log('Empresa creada:', response);
        console.log('Usuario actualizado:', JSON.parse(localStorage.getItem('user')));

        // Emitir evento de registro exitoso
        this.$emit('register-success');

        // Redireccionar después de un breve delay
        setTimeout(() => {
          // Construye la ruta absoluta para evitar ambigüedades
          const homePath = `/${APP_ROUTES.COMPANY.ROOT}/${APP_ROUTES.COMPANY.HOME}`;
          this.$router.push(homePath); // Esto resultará en '/company/home'
        }, 1500);

      } catch (error) {
        console.error('Error al registrar empresa:', error);

        // Manejar diferentes tipos de errores
        if (error.response) {
          // Error del servidor
          this.error = error.response.data?.message || 'Error del servidor al registrar la empresa';
        } else if (error.request) {
          // Error de red
          this.error = 'Error de conexión. Verifique su conexión a internet';
        } else {
          // Otro tipo de error
          this.error = 'Ocurrió un error inesperado al registrar la empresa';
        }
      } finally {
        this.isLoading = false;
      }
    }
  },

  // Limpiar URLs de objeto cuando el componente se destruye
  beforeUnmount() {
    if (this.previewImage) {
      URL.revokeObjectURL(this.previewImage);
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.logo-upload-container {
  margin-bottom: 1.5rem;
}

.logo-upload {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  transition: border-color 0.3s ease;
}

.logo-upload:hover {
  border-color: #333;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.file-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: left;
}

.file-name {
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
}

.file-size {
  color: #666;
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
}

.remove-file-btn {
  background: #e53935;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.remove-file-btn:hover {
  background: #c62828;
}

.form-group {
  margin-bottom: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #333;
}

.error-message {
  color: #e53935;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: left;
  background-color: #ffebee;
  padding: 0.5rem;
  border-radius: 4px;
}

.success-message {
  color: #2e7d32;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: left;
  background-color: #e8f5e8;
  padding: 0.5rem;
  border-radius: 4px;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background-color 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: #555;
}

.btn-primary:disabled {
  background-color: #999;
  cursor: not-allowed;
}
</style>