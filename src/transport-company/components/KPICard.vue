<template>
  <div class="kpi-card">
    <div class="kpi-icon-wrap">
      <component :is="icon" class="kpi-icon" />
    </div>
    <div class="kpi-body">
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon:  { type: [Object, Function], required: true },
  value: { type: [String, Number], required: true },
  label: { type: String, required: true },
  color: { type: String, default: '#C9A84C' },
})
</script>

<style scoped>
.kpi-card {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.kpi-card:hover {
  border-color: var(--gold-500);
  box-shadow: 0 4px 20px rgba(201,168,76,0.15);
}
.kpi-icon-wrap {
  width: 52px;
  height: 52px;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--gold-500);
}
.kpi-icon { width: 24px; height: 24px; }
.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gold-400);
  letter-spacing: -0.03em;
  line-height: 1;
}
.kpi-label {
  font-size: 0.8rem;
  color: var(--carbon-400);
  margin-top: 4px;
  font-weight: 500;
}
</style>
