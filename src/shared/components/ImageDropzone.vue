<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  modelValue: { type: [File, Object], default: null }, // File | null
  accept: { type: String, default: 'image/*' },
  maxSizeMb: { type: Number, default: 5 }
})
const emit = defineEmits(['update:modelValue'])
const toast = useToast()

const fileInput = ref(null)
const dragging = ref(false)
const preview = ref(null)

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

const fileName = computed(() => props.modelValue?.name || '')

watch(() => props.modelValue, (f) => {
  if (!f) { preview.value = null; return }
  const reader = new FileReader()
  reader.onload = (e) => { preview.value = e.target.result }
  reader.readAsDataURL(f)
})

function pick() {
  fileInput.value?.click()
}

function onInputChange(e) {
  handleFile(e.target.files?.[0])
}

function onDrop(e) {
  dragging.value = false
  handleFile(e.dataTransfer?.files?.[0])
}

function handleFile(file) {
  if (!file) return
  if (!allowedTypes.includes(file.type)) {
    toast?.add({ severity: 'warn', summary: 'Archivo no válido', detail: 'Solo se permiten imágenes JPG, PNG, GIF o WEBP.', life: 3000 })
    return
  }
  const maxSize = props.maxSizeMb * 1024 * 1024
  if (file.size > maxSize) {
    toast?.add({ severity: 'warn', summary: 'Archivo muy grande', detail: `La imagen debe pesar menos de ${props.maxSizeMb}MB.`, life: 3000 })
    return
  }
  emit('update:modelValue', file)
}

function remove() {
  emit('update:modelValue', null)
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="dropzone-wrap">
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="hidden-input"
      @change="onInputChange"
    />

    <!-- Preview -->
    <div v-if="modelValue && preview" class="preview">
      <img :src="preview" alt="preview" class="preview-img" />
      <div class="preview-info">
        <span class="preview-name">{{ fileName }}</span>
        <button type="button" class="preview-remove" @click="remove">
          <i class="pi pi-times"></i> Quitar
        </button>
      </div>
    </div>

    <!-- Dropzone -->
    <div
      v-else
      class="dropzone"
      :class="{ dragging }"
      @click="pick"
      @dragover.prevent="dragging = true"
      @dragenter.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <i class="pi pi-cloud-upload dz-icon"></i>
      <p class="dz-text">Arrastra una imagen aquí o <span class="dz-link">haz click para seleccionar</span></p>
      <small class="dz-hint">JPG, PNG, GIF o WEBP · máx {{ maxSizeMb }}MB</small>
    </div>
  </div>
</template>

<style scoped>
.dropzone-wrap { width: 100%; }
.hidden-input { display: none; }

.dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; text-align: center; cursor: pointer;
  padding: 1.75rem 1rem;
  border: 2px dashed var(--carbon-600);
  border-radius: var(--radius-md);
  background: var(--carbon-900);
  transition: border-color var(--duration-fast) ease, background var(--duration-fast) ease;
}
.dropzone:hover, .dropzone.dragging {
  border-color: var(--gold-500);
  background: rgba(201,168,76,0.06);
}
.dz-icon { font-size: 1.6rem; color: var(--gold-500); }
.dz-text { font-size: 0.85rem; color: var(--carbon-300); }
.dz-link { color: var(--gold-400); font-weight: 600; }
.dz-hint { font-size: 0.72rem; color: var(--carbon-500); }

.preview {
  display: flex; align-items: center; gap: 14px;
  padding: 12px;
  border: 1px solid var(--carbon-600);
  border-radius: var(--radius-md);
  background: var(--carbon-900);
}
.preview-img {
  width: 72px; height: 72px; object-fit: cover;
  border-radius: var(--radius-sm); border: 1px solid var(--carbon-700);
}
.preview-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.preview-name {
  font-size: 0.8rem; color: var(--carbon-200);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;
}
.preview-remove {
  align-self: flex-start;
  background: none; border: none; color: #e57373; cursor: pointer;
  font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px; padding: 0;
}
.preview-remove:hover { text-decoration: underline; }
</style>
