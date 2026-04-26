<template>
  <div class="skeleton-wrap" :style="{ width, height, borderRadius: radius }">
    <div class="shimmer"></div>
  </div>
</template>

<script setup>
defineProps({
  width:  { type: String, default: '100%' },
  height: { type: String, default: '16px' },
  radius: { type: String, default: '6px' },
})
</script>

<style scoped>
.skeleton-wrap {
  overflow: hidden;
  background: var(--carbon-700);
  position: relative;
}
.shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 50%; }
  100% { background-position: -200% 50%; }
}
</style>
