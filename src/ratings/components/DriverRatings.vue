<script setup>
import { ref, watch, onMounted } from 'vue'
import StarRating from '@/shared/components/StarRating.vue'
import { RatingService } from '@/ratings/services/rating.service.js'
import { Rating } from '@/ratings/models/rating.entity.js'

const props = defineProps({
  driverId: { type: [Number, String], required: true }
})

const service = new RatingService()

const summary = ref({ average: 0, count: 0 })
const ratings = ref([])
const loading = ref(false)
const error = ref('')

/** Redondea el promedio a estrella entera para el StarRating (readonly). */
function roundedAverage() {
  return Math.round(summary.value.average || 0)
}

/** Formatea la fecha ISO del backend a un formato local legible. */
function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  if (props.driverId === null || props.driverId === undefined || props.driverId === '') return
  loading.value = true
  error.value = ''
  try {
    const [summaryData, list] = await Promise.all([
      service.getDriverSummary(props.driverId),
      service.getRatingsByDriverId(props.driverId)
    ])
    summary.value = {
      average: summaryData?.average ?? 0,
      count: summaryData?.count ?? 0
    }
    ratings.value = (Array.isArray(list) ? list : []).map(item => new Rating(item))
  } catch (e) {
    error.value = 'No se pudieron cargar las calificaciones del conductor.'
    summary.value = { average: 0, count: 0 }
    ratings.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.driverId, load)

defineExpose({ load })
</script>

<template>
  <section class="driver-ratings">
    <header class="dr-summary">
      <div class="dr-summary-score">
        <span class="dr-average">{{ summary.average.toFixed(1) }}</span>
        <StarRating :model-value="roundedAverage()" readonly />
      </div>
      <span class="dr-count">
        {{ summary.count }} {{ summary.count === 1 ? 'calificación' : 'calificaciones' }}
      </span>
    </header>

    <p v-if="loading" class="dr-state">Cargando calificaciones…</p>
    <p v-else-if="error" class="dr-state dr-error">{{ error }}</p>
    <p v-else-if="ratings.length === 0" class="dr-state">
      Este conductor aún no tiene calificaciones.
    </p>

    <ul v-else class="dr-list">
      <li v-for="rating in ratings" :key="rating.id" class="dr-item">
        <div class="dr-item-head">
          <StarRating :model-value="rating.score" readonly />
          <span class="dr-item-date">{{ formatDate(rating.createdAt) }}</span>
        </div>
        <p v-if="rating.comment" class="dr-item-comment">{{ rating.comment }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.driver-ratings {
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
  color: var(--ink);
  font-family: var(--font-family);
}

.dr-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--carbon-700);
  margin-bottom: 1rem;
}
.dr-summary-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.dr-average {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gold-600);
  line-height: 1;
}
.dr-count {
  font-size: 0.8rem;
  color: var(--carbon-400);
}

.dr-state {
  font-size: 0.875rem;
  color: var(--carbon-400);
  margin: 0.5rem 0;
}
.dr-error { color: var(--danger); }

.dr-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.dr-item {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}
.dr-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.dr-item-date {
  font-size: 0.75rem;
  color: var(--carbon-400);
}
.dr-item-comment {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--carbon-300);
  line-height: 1.4;
}
</style>
