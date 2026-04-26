<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import ScheduleDayCard from "@/network/components/schedule-popUps/schedule-day-card.component.vue";
import {RouteService} from "@/network/services/route.service.js";

const {routeInfo} = defineProps({
  routeInfo: { type: Object },
  visibleSchedule:  Boolean,
})

const emit = defineEmits(['update:visibleSchedule', 'handleBack', "created"])

const toast = useToast()

const weekDays = [
  { key: 'sunday', name: 'Domingo' },
  { key: 'monday', name: 'Lunes' },
  { key: 'tuesday', name: 'Martes' },
  { key: 'wednesday', name: 'Miércoles' },
  { key: 'thursday', name: 'Jueves' },
  { key: 'friday', name: 'Viernes' },
  { key: 'saturday', name: 'Sábado' }
]

const scheduleData = reactive({
  sunday: { enabled: true, startTime: '10:00', endTime: '17:00', isValid: true },
  monday: { enabled: true, startTime: '10:00', endTime: '17:00', isValid: true },
  tuesday: { enabled: true, startTime: '10:00', endTime: '17:00', isValid: true },
  wednesday: { enabled: true, startTime: '10:00', endTime: '17:00', isValid: true },
  thursday: { enabled: true, startTime: '10:00', endTime: '17:00', isValid: true },
  friday: { enabled: true, startTime: '10:00', endTime: '17:00', isValid: true },
  saturday: { enabled: true, startTime: '10:00', endTime: '17:00', isValid: true }
})

const validationErrors = ref([])
const hasGlobalErrors = ref(false)

const validateGlobalSchedule = () => {
  const errors = []
  const enabledDays = Object.entries(scheduleData).filter(([_, day]) => day.enabled)

  if (enabledDays.length === 0) {
    errors.push('Debe seleccionar al menos un día de atención')
  }

  const invalidDays = enabledDays.filter(([_, day]) => day.isValid === false)
  if (invalidDays.length > 0) {
    errors.push('Corrija los errores en los horarios marcados')
  }

  const weekendDays = enabledDays.filter(([key, _]) => key === 'sunday' || key === 'saturday')
  if (weekendDays.length > 0 && enabledDays.length === weekendDays.length) {
    errors.push('Recomendamos tener al menos un día de atención entre semana')
  }

  const totalHours = enabledDays.reduce((total, [_, day]) => {
    if (day.startTime && day.endTime) {
      const start = new Date(`2000-01-01 ${day.startTime}`)
      const end = new Date(`2000-01-01 ${day.endTime}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }
    return total
  }, 0)

  if (totalHours > 80) {
    errors.push('El total de horas semanales no debería exceder 80 horas')
  }

  if (totalHours < 8) {
    errors.push('Se recomienda un mínimo de 8 horas semanales de atención')
  }

  validationErrors.value = errors
  hasGlobalErrors.value = errors.length > 0

  return errors.length === 0
}

const isFormValid = computed(() => {
  const enabledDays = Object.values(scheduleData).filter(day => day.enabled)

  if (enabledDays.length === 0) {
    return false
  }
  const allValid = enabledDays.every(day => day.isValid !== false)
  return allValid && !hasGlobalErrors.value
})

const showToast = (severity, summary, detail) => {
  toast.add({
    severity,
    summary,
    detail,
    life: 3000
  })
}

const updateDaySchedule = (dayKey, schedule) => {
  scheduleData[dayKey] = { ...schedule }
  setTimeout(() => {
    validateGlobalSchedule()
  }, 100)
}

const handleSave = async  () => {
 if (!validateGlobalSchedule()) {
    showToast('error', 'Error', 'Por favor corrija los errores antes de continuar')
    return
  }
  if (!isFormValid.value) {
    showToast('error', 'Error', 'Formulario inválido')
    return
  }

  // 2. Creación completa de la ruta
  try {
    const appRouteService = new RouteService();
    await appRouteService.createFullRoute(routeInfo, scheduleData)
    showToast('success', 'Éxito', 'Se ha creado una nueva ruta')
    } catch (err) {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la ruta' })
      return
    }
  // 4. Cerrar el popup
  emit('update:visibleSchedule', false)
  emit("created")
}

onMounted(() => {
  validateGlobalSchedule()
})
</script>

<template>
  <pb-Dialog :visible="visibleSchedule"
             @update:visible="val => emit('update:visibleSchedule', val)"
             @hide="emit('update:visibleSchedule', false)"
             modal
             :style="{ width: '50rem'}"
  >
    <template #header >
      <h1 class="title">Horario de atención</h1>
    </template>
    <div class="modal-container">
      <div class="modal-content">
        <div v-if="hasGlobalErrors" class="validation-errors">
          <Message
              v-for="(error, index) in validationErrors"
              :key="index"
              severity="warn"
              :closable="false"
              class="error-item"
          >
            {{ error }}
          </Message>
        </div>

        <div class="schedule-container">
          <ScheduleDayCard
              v-for="day in weekDays"
              :key="day.key"
              :day-name="day.name"
              :schedule="scheduleData[day.key]"
              @update:schedule="updateDaySchedule(day.key, $event)"
          />
        </div>

        <div class="modal-actions">
          <Button
              label="Regresar"
              severity="secondary"
              outlined
              class="btn-back"
              @click="emit('handleBack')"
          />
          <Button
              label="Guardar y salir"
              class="btn-continue"
              :disabled="!isFormValid"
              @click="handleSave"
          />
        </div>
      </div>
      </div>
  </pb-Dialog>
</template>

<style scoped>
.modal-container {
  background: white;
  transform: translateY(0);
  transition: all 0.3s ease;
  animation: modalSlideIn 0.4s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.title{
  color: var(--color-primary);
  border-bottom: var(--color-primary) solid 1px;
  padding: 10px;
}

.modal-content {
  padding: 0;
  background: white;
}

.validation-errors {
  padding: 20px 32px 0 32px;
}

.error-item {
  margin-bottom: 8px;
  border-radius: 8px;
}

.schedule-container {
  background: white;
}

.schedule-container::-webkit-scrollbar {
  width: 6px;
}

.schedule-container::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.schedule-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.schedule-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.modal-actions {
  display: flex;
  gap: 16px;
  padding: 24px 32px 32px 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #e2e8f0;
}

/* Estilos para los botones */
:deep(.btn-continue) {
  flex: 1;
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) ;
  border: none ;
  color: white ;
  padding: 14px 24px ;
  border-radius: 10px ;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

:deep(.btn-continue:hover:not(:disabled)) {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4);
}

:deep(.btn-continue:disabled) {
  background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
  opacity: 0.7 ;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: not-allowed ;
}

:deep(.btn-back) {
  flex: 1;
  background: white;
  color: #6b7280 ;
  border: 2px solid #e5e7eb;
  padding: 14px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
}

:deep(.btn-back:hover) {
  background: #f9fafb ;
  border-color: #d1d5db;
  transform: translateY(-1px) ;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) ;
}

:deep(.p-message) {
  border-radius: 8px;
  font-size: 14px;
}

@media (max-width: 640px) {
  .page-wrapper {
    padding: 16px;
  }

  .modal-header {
    padding: 24px 24px 20px 24px;
  }

  .modal-title {
    font-size: 24px;
  }

  .modal-actions {
    flex-direction: column;
    padding: 20px 24px 24px 24px;
  }

  .validation-errors {
    padding: 16px 24px 0 24px;
  }
}
</style>