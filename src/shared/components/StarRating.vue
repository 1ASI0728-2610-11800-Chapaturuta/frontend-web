<template>
  <div class="star-rating" :class="{ interactive: !readonly }">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="star-btn"
      :class="{ filled: star <= (hovered || modelValue), readonly }"
      @mouseenter="!readonly && (hovered = star)"
      @mouseleave="!readonly && (hovered = 0)"
      @click="!readonly && $emit('update:modelValue', star)"
      :tabindex="readonly ? -1 : 0"
    >
      <i class="pi pi-star-fill"></i>
    </button>
    <span v-if="showCount && count > 0" class="rating-count">({{ count }})</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: Number, default: 0 },
  readonly:   { type: Boolean, default: false },
  showCount:  { type: Boolean, default: false },
  count:      { type: Number, default: 0 },
})
defineEmits(['update:modelValue'])

const hovered = ref(0)
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.star-btn {
  background: none;
  border: none;
  padding: 2px;
  cursor: default;
  color: var(--carbon-600);
  font-size: 16px;
  transition: color var(--duration-fast) ease, transform var(--duration-fast) ease;
  line-height: 1;
}
.interactive .star-btn { cursor: pointer; }
.star-btn.filled { color: var(--gold-500); }
.interactive .star-btn:hover { transform: scale(1.2); }
.rating-count {
  font-size: 12px;
  color: var(--carbon-400);
  margin-left: 4px;
}
</style>
