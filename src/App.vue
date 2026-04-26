<template>
  <div id="app">
    <router-view
        @login-success="handleLoginSuccess"
        @register-success="handleRegisterSuccess"
    />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return { isAuthenticated: false }
  },
  created() {
    const token = localStorage.getItem('authToken')
    this.isAuthenticated = !!token
  },
  methods: {
    handleLoginSuccess() {
      this.isAuthenticated = true
      this.$router.push('/')
    },
    handleRegisterSuccess() {
      this.isAuthenticated = true
      this.$router.push('/')
    }
  }
}
</script>

<style>
:root {
  /* Carbon palette */
  --carbon-950: #0A0A0A;
  --carbon-900: #1A1A1A;
  --carbon-800: #2D2D2D;
  --carbon-700: #3D3D3D;
  --carbon-600: #4A4A4A;
  --carbon-500: #6A6A6A;
  --carbon-400: #8A8A8A;
  --carbon-300: #BEBEBE;
  --carbon-200: #D4D4D4;
  --carbon-100: #E8E8E8;
  --carbon-50:  #F5F5F5;

  /* Gold palette */
  --gold-500: #C9A84C;
  --gold-400: #D4B85C;
  --gold-300: #E0C96E;
  --gold-600: #B8943F;
  --gold-100: #F5ECD0;

  /* Semantic */
  --success: #4ADE80;
  --danger:  #F87171;
  --info:    #60A5FA;
  --warning: #FBBF24;

  /* Gradients */
  --gradient-card: linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%);
  --gradient-gold: linear-gradient(135deg, #C9A84C 0%, #D4B85C 50%, #E0C96E 100%);
  --gradient-hero: linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 40%, #2D2D2D 100%);

  /* Shadows */
  --shadow-card:     0 4px 24px rgba(0,0,0,0.4);
  --shadow-elevated: 0 8px 32px rgba(0,0,0,0.6);
  --shadow-gold:     0 0 20px rgba(201,168,76,0.3);

  /* Typography */
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Easing */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast:     150ms;
  --duration-normal:   300ms;
  --duration-slow:     500ms;
  --duration-entrance: 600ms;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background-color: var(--carbon-900);
  color: var(--carbon-100);
}

#app {
  width: 100%;
  min-height: 100vh;
  background-color: var(--carbon-900);
}

/* ── Page transitions ── */
.page-enter-active {
  transition: all var(--duration-slow) var(--ease-out-expo);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.page-leave-active {
  transition: all var(--duration-normal) ease-in;
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ── List stagger ── */
.list-enter-active {
  transition: all 0.4s var(--ease-out-expo);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.list-move {
  transition: transform 0.4s ease;
}

/* ── Gold shimmer keyframe ── */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* ── Fade transition ── */
.fade-enter-active, .fade-leave-active { transition: opacity var(--duration-normal) ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
