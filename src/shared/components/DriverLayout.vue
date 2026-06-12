<script>
import DriverToolbar from '@/shared/components/driver-toolbar/toolbar-driver.component.vue'

export default {
  name: 'DriverLayout',
  components: { DriverToolbar }
}
</script>

<template>
  <DriverToolbar />
  <main class="driver-main">
    <div class="driver-content">
      <transition name="page" mode="out-in">
        <router-view />
      </transition>
    </div>
  </main>

  <pb-Toast />
</template>

<style scoped>
.driver-main {
  min-height: calc(100vh - 64px);
  background: var(--carbon-900);
}
.driver-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
