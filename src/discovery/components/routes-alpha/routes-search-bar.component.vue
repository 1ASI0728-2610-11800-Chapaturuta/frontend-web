<script>
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";

// Búsqueda por lugar de INICIO (primer paradero) y lugar de FIN (último paradero).
// modelValue es un objeto { origin, destination }.
export default {
  name: "routes-search-bar",
  components: { IconField, InputIcon, InputText },
  props: {
    modelValue: {
      type: Object,
      default: () => ({ origin: "", destination: "" })
    }
  },
  emits: ["update:modelValue"],
  computed: {
    origin: {
      get() { return this.modelValue?.origin ?? "" },
      set(val) { this.$emit("update:modelValue", { ...this.modelValue, origin: val }) }
    },
    destination: {
      get() { return this.modelValue?.destination ?? "" },
      set(val) { this.$emit("update:modelValue", { ...this.modelValue, destination: val }) }
    },
    hasValue() {
      return Boolean((this.origin || "").trim() || (this.destination || "").trim())
    }
  },
  methods: {
    clearAll() {
      this.$emit("update:modelValue", { origin: "", destination: "" })
    }
  }
}
</script>

<template>
  <div class="routes-search-bar">
    <IconField iconPosition="left" class="search-field">
      <InputIcon class="pi pi-map-marker origin-icon" />
      <InputText
        v-model="origin"
        type="text"
        class="pb-InputText search-input"
        placeholder="Lugar de inicio..."
      />
    </IconField>

    <i class="pi pi-arrow-right sep-arrow"></i>

    <IconField iconPosition="left" class="search-field">
      <InputIcon class="pi pi-flag dest-icon" />
      <InputText
        v-model="destination"
        type="text"
        class="pb-InputText search-input"
        placeholder="Lugar de destino..."
      />
    </IconField>

    <button v-if="hasValue" type="button" class="clear-btn" title="Limpiar búsqueda" @click="clearAll">
      <i class="pi pi-times"></i>
    </button>
  </div>
</template>

<style scoped>
.routes-search-bar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.search-field { flex: 1; min-width: 220px; display: block; }
.sep-arrow { color: var(--gold-500); font-size: 1rem; flex-shrink: 0; }
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
  box-shadow: 0 0 0 2px rgba(139,92,246,0.2);
  outline: none;
}
.search-input::placeholder { color: var(--carbon-500); }
:deep(.p-inputicon) { color: var(--carbon-400); }
:deep(.origin-icon) { color: var(--gold-400); }
:deep(.dest-icon) { color: var(--gold-400); }
.clear-btn {
  flex-shrink: 0;
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  color: var(--carbon-400);
  cursor: pointer;
}
.clear-btn:hover { color: var(--danger); border-color: var(--danger); }
</style>
