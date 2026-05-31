<script>
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";

export default {
  name: "routes-search-bar",
  components: { IconField, InputIcon, InputText },
  props: {
    modelValue: { type: String, default: "" }
  },
  emits: ["update:modelValue"],
  computed: {
    localValue: {
      get() { return this.modelValue },
      set(val) { this.$emit("update:modelValue", val) }
    }
  }
}
</script>

<template>
  <div class="routes-search-bar">
    <IconField iconPosition="left" class="search-field">
      <InputIcon class="pi pi-search" />
      <InputText
        v-model="localValue"
        type="text"
        class="pb-InputText search-input"
        placeholder="Buscar ruta por paradero o dirección..."
      />
    </IconField>
  </div>
</template>

<style scoped>
.routes-search-bar { width: 100%; }
.search-field { width: 100%; display: block; }
.search-input {
  width: 100%;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  color: var(--carbon-50);
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 0.95rem;
}
.search-input:focus {
  border-color: var(--gold-500);
  box-shadow: 0 0 0 2px rgba(201,168,76,0.2);
  outline: none;
}
.search-input::placeholder { color: var(--carbon-500); }
:deep(.p-inputicon) { color: var(--carbon-400); }
</style>
