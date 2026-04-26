<script>
/*import { Schedule } from "../../models/schedule.entity.js";*/

export default {
  name: "schedule-detail-item",
  props: {
    schedules: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    groupedSchedules() {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const result = {};

      days.forEach(day => {
        const daySchedules = this.schedules.filter(s => s.day === day);
        if (daySchedules.length > 0) {
          result[day] = daySchedules;
        } else {
          // Default schedule if none exists
          result[day] = [{
            timeFrom: '12:00pm',
            timeTo: '5:00pm',
            isAvailable: true
          }];
        }
      });

      return result;
    }
  },
  methods: {
    isAvailable(schedule) {
      return schedule.isAvailable;
    }
  }
}
</script>

<template>
  <div class="schedule-container">
    <h2 class="schedule-title">Horarios de atención</h2>

    <div class="schedule-table">
      <div v-for="(schedules, day) in groupedSchedules" :key="day" class="schedule-row">
        <div class="day-name">{{ day }}</div>
        <div class="schedule-times">
          <template v-for="(schedule, index) in schedules" :key="index">
            <div
                class="time-slot"
                :class="{ 'unavailable': !isAvailable(schedule) }"
            >
              {{ schedule.timeFrom }} - {{ schedule.timeTo }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.schedule-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #37123C;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
}

.schedule-row {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.schedule-row:last-child {
  border-bottom: none;
}

.day-name {
  width: 120px;
  font-weight: 500;
}

.schedule-times {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.time-slot {
  padding: 2px 0;
}

.time-slot.unavailable {
  color: #999;
  text-decoration: line-through;
}
</style>