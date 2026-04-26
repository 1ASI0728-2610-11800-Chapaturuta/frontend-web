<script>
import companyToolbar from "@/shared/components/company-toolbar/toolbar-company.component.vue";

export default {
  components: { companyToolbar }
}
</script>

<template>
  <company-toolbar/>
  <main class="company-main">
    <div class="company-content">
      <transition name="page" mode="out-in">
        <router-view />
      </transition>
    </div>
  </main>
</template>

<style scoped>
.company-main {
  min-height: calc(100vh - 64px);
  background: var(--carbon-900);
}
.company-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>