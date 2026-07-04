<script>
export default {
  name: "schedule-detail-item",
  props: {
    schedules: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    // Backend returns { dayOfWeek, startTime, endTime, enabled }. Group enabled
    // schedules by day, ordered Mon-Sun. Accent-insensitive day matching.
    orderedDays() {
      const order = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const norm = (v) => String(v ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .trim().toLowerCase();
      return order
        .map(day => ({
          day,
          slots: this.schedules.filter(s => s.enabled !== false && norm(s.dayOfWeek) === norm(day))
        }))
        .filter(entry => entry.slots.length > 0);
    },
    hasSchedules() {
      return this.orderedDays.length > 0;
    }
  }
}
</script>

<template>
  <div v-if="hasSchedules" class="schedule-container">
    <h2 class="schedule-title">Horarios de atención</h2>
    <div class="schedule-table">
      <div v-for="entry in orderedDays" :key="entry.day" class="schedule-row">
        <div class="day-name">{{ entry.day }}</div>
        <div class="schedule-times">
          <div v-for="(slot, index) in entry.slots" :key="index" class="time-slot">
            {{ slot.startTime }} - {{ slot.endTime }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-container {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}
.schedule-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--carbon-50);
}
.schedule-table { display: flex; flex-direction: column; }
.schedule-row {
  display: flex;
  gap: 16px;
  border-bottom: 1px solid var(--carbon-700);
  padding: 10px 0;
}
.schedule-row:last-child { border-bottom: none; }
.day-name { width: 110px; font-weight: 600; color: var(--carbon-200); font-size: 0.9rem; }
.schedule-times { flex: 1; display: flex; flex-wrap: wrap; gap: 8px; }
.time-slot {
  padding: 3px 10px;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 999px;
  color: var(--gold-400);
  font-size: 0.82rem;
  font-weight: 600;
}
</style>
