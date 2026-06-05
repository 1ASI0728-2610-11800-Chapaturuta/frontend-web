<script setup>
import { ref, computed } from 'vue'
import StarRating from '@/shared/components/StarRating.vue'

const props = defineProps({
  /** ID del conductor a calificar. */
  driverId: { type: [Number, String], required: true },
  /** ID del viaje completado que origina la calificación. */
  tripId: { type: [Number, String], default: null },
  /** Estado de envío controlado por el padre (ej. mientras persiste). */
  submitting: { type: Boolean, default: false }
})

/**
 * Emite el payload listo para RatingService.createRating.
 * El padre decide cuándo persistir (no acoplamos el form al servicio).
 */
const emit = defineEmits(['submit'])

const score = ref(0)
const comment = ref('')

const canSubmit = computed(() => score.value >= 1 && score.value <= 5 && !props.submitting)

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    fkIdDriver: props.driverId,
    fkIdTrip: props.tripId,
    score: score.value,
    comment: comment.value.trim()
  })
}

/** Reinicia el formulario (útil para el padre tras un envío exitoso). */
function reset() {
  score.value = 0
  comment.value = ''
}

defineExpose({ reset })
</script>

<template>
  <form class="rate-driver-form" @submit.prevent="onSubmit">
    <div class="rdf-field">
      <label class="rdf-label">Tu calificación</label>
      <StarRating v-model="score" />
    </div>

    <div class="rdf-field">
      <label class="rdf-label" for="rdf-comment">Comentario (opcional)</label>
      <textarea
        id="rdf-comment"
        v-model="comment"
        class="rdf-textarea"
        rows="3"
        maxlength="500"
        placeholder="Cuéntanos cómo fue tu viaje…"
      ></textarea>
    </div>

    <button type="submit" class="rdf-submit" :disabled="!canSubmit">
      {{ submitting ? 'Enviando…' : 'Enviar calificación' }}
    </button>
  </form>
</template>

<style scoped>
.rate-driver-form {
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--ink);
  font-family: var(--font-family);
}

.rdf-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.rdf-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--carbon-200);
}

.rdf-textarea {
  width: 100%;
  resize: vertical;
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--ink);
  transition: border-color var(--duration-fast) ease;
}
.rdf-textarea:focus {
  outline: none;
  border-color: var(--gold-500);
}
.rdf-textarea::placeholder { color: var(--carbon-500); }

.rdf-submit {
  align-self: flex-start;
  background: var(--gold-600);
  color: var(--surface);
  border: none;
  border-radius: var(--radius-md);
  padding: 0.6rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-fast) ease, opacity var(--duration-fast) ease;
}
.rdf-submit:hover:not(:disabled) { background: var(--gold-500); }
.rdf-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
