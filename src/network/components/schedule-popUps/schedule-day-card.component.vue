<script setup>
import { ref, watch } from 'vue'
import DatePicker from 'primevue/datepicker'
import Message from 'primevue/message'

const props = defineProps({
  dayName: {
    type: String,
    required: true
  },
  schedule: {
    type: Object,
    required: true,
    default: () => ({
      enabled: false,
      startTime: '',
      endTime: ''
    })
  }
})

const emit = defineEmits(['update:schedule'])

const localSchedule = ref({ ...props.schedule })

const startTime = ref(null)
const endTime = ref(null)
const hasError = ref(false)
const errorMessage = ref('')

const initializeTimes = () => {
  if (localSchedule.value.startTime) {
    const [hours, minutes] = localSchedule.value.startTime.split(':')
    startTime.value = new Date()
    startTime.value.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  }

  if (localSchedule.value.endTime) {
    const [hours, minutes] = localSchedule.value.endTime.split(':')
    endTime.value = new Date()
    endTime.value.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  }
}

const validateTimeRange = () => {
  if (!localSchedule.value.enabled) {
    hasError.value = false
    errorMessage.value = ''
    return true
  }

  if (!localSchedule.value.startTime || !localSchedule.value.endTime) {
    hasError.value = true
    errorMessage.value = 'Debe completar ambos horarios'
    return false
  }

  if (localSchedule.value.startTime >= localSchedule.value.endTime) {
    hasError.value = true
    errorMessage.value = 'La hora de inicio debe ser menor que la de fin'
    return false
  }

  const start = new Date(`2000-01-01 ${localSchedule.value.startTime}`)
  const end = new Date(`2000-01-01 ${localSchedule.value.endTime}`)
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

  if (diffHours < 1) {
    hasError.value = true
    errorMessage.value = 'El horario debe ser de al menos 1 hora'
    return false
  }

  hasError.value = false
  errorMessage.value = ''
  return true
}

const handleToggleClick = () => {
  localSchedule.value.enabled = !localSchedule.value.enabled
  handleToggleChange()
}

const handleToggleChange = () => {
  if (!localSchedule.value.enabled) {
    localSchedule.value.startTime = ''
    localSchedule.value.endTime = ''
    startTime.value = null
    endTime.value = null
    hasError.value = false
    errorMessage.value = ''
  } else {
    localSchedule.value.startTime = '10:00'
    localSchedule.value.endTime = '17:00'
    initializeTimes()
  }
  emitUpdate()
}

const handleStartTimeChange = () => {
  if (startTime.value) {
    const hours = startTime.value.getHours().toString().padStart(2, '0')
    const minutes = startTime.value.getMinutes().toString().padStart(2, '0')
    localSchedule.value.startTime = `${hours}:${minutes}`
    validateTimeRange()
    emitUpdate()
  }
}

const handleEndTimeChange = () => {
  if (endTime.value) {
    const hours = endTime.value.getHours().toString().padStart(2, '0')
    const minutes = endTime.value.getMinutes().toString().padStart(2, '0')
    localSchedule.value.endTime = `${hours}:${minutes}`
    validateTimeRange()
    emitUpdate()
  }
}

const emitUpdate = () => {
  const isValid = validateTimeRange()
  emit('update:schedule', {
    ...localSchedule.value,
    isValid
  })
}

watch(() => props.schedule, (newSchedule) => {
  localSchedule.value = { ...newSchedule }
  initializeTimes()
  validateTimeRange()
}, { deep: true })

initializeTimes()
validateTimeRange()
</script>
<template>
  <div class="schedule-day-row">
    <div class="day-content">
      <span class="day-name">{{ dayName }}</span>
      <div class="toggle-container">
        <div class="custom-toggle" :class="{ 'active': localSchedule.enabled }" @click="handleToggleClick">
          <div class="toggle-track">
            <div class="toggle-thumb"></div>
          </div>
          <input
              type="checkbox"
              v-model="localSchedule.enabled"
              @change="handleToggleChange"
              class="toggle-input"
          >
        </div>
      </div>
      <div v-if="localSchedule.enabled" class="time-inputs">
        <DatePicker
            v-model="startTime"
            timeOnly
            hourFormat="24"
            placeholder="10:00"
            class="time-picker"
            :class="{ 'p-invalid': hasError }"
            @date-select="handleStartTimeChange"
        />
        <span class="time-separator">a</span>
        <DatePicker
            v-model="endTime"
            timeOnly
            hourFormat="24"
            placeholder="17:00"
            class="time-picker"
            :class="{ 'p-invalid': hasError }"
            @date-select="handleEndTimeChange"
        />
      </div>
    </div>
    <!-- Error message -->
    <div v-if="hasError && localSchedule.enabled" class="error-container">
      <Message
          severity="error"
          :closable="false"
          class="error-message"
      >
        {{ errorMessage }}
      </Message>
    </div>
  </div>
</template>

<style scoped>
.schedule-day-row {
  border-bottom: 1px solid #e5e7eb;
  background: white;
  transition: background-color 0.2s ease;
}

.schedule-day-row:hover {
  background: #fafbfc;
}

.day-content {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  gap: 16px;
}

.day-name {
  color: #374151;
  font-weight: 500;
  min-width: 80px;
  font-size: 14px;
}

.toggle-container {
  margin-left: 16px;
}

/* Custom Toggle Switch */
.custom-toggle {
  position: relative;
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-track {
  width: 52px;
  height: 28px;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  border-radius: 14px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.05);
}

.toggle-thumb {
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* Active state */
.custom-toggle.active .toggle-track {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow:
      inset 0 2px 4px rgba(59, 130, 246, 0.3),
      0 1px 2px rgba(59, 130, 246, 0.2);
}

.custom-toggle.active .toggle-thumb {
  transform: translateX(24px);
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  box-shadow:
      0 3px 6px rgba(59, 130, 246, 0.2),
      0 1px 3px rgba(59, 130, 246, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* Hover effects */
.custom-toggle:hover .toggle-track {
  transform: scale(1.02);
}

.custom-toggle:hover .toggle-thumb {
  box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.custom-toggle.active:hover .toggle-thumb {
  box-shadow:
      0 4px 8px rgba(59, 130, 246, 0.3),
      0 2px 4px rgba(59, 130, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* Active click effect */
.custom-toggle:active .toggle-track {
  transform: scale(0.98);
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 24px;
}

.time-separator {
  color: #6b7280;
  font-size: 14px;
  font-weight: 400;
}

.error-container {
  padding: 0 24px 16px 24px;
}

/* Estilos para DatePicker */
:deep(.time-picker) {
  width: 80px;
}

:deep(.time-picker .p-inputtext) {
  padding: 8px 10px ;
  font-size: 14px ;
  border: 2px solid #e5e7eb ;
  border-radius: 8px ;
  transition: all 0.2s ease ;
  font-weight: 500;
}

:deep(.time-picker .p-inputtext:focus) {
  border-color: #3b82f6 ;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) ;
  outline: none;
}

:deep(.time-picker.p-invalid .p-inputtext) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

:deep(.error-message) {
  font-size: 12px ;
  padding: 8px 12px;
  border-radius: 6px;
}

:deep(.error-message.p-message-error) {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}
</style>