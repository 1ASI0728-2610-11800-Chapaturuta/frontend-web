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
  /* Carbon palette — LIGHT theme.
     Ramp semantics preserved (high numbers = surfaces, low numbers = text),
     but flipped to light: 950/800 = white surfaces, 50/100 = dark ink.
     --carbon-950 doubles as on-accent text (white) on the purple accent. */
  --carbon-950: #FFFFFF;
  --carbon-900: #F4F3F9;
  --carbon-800: #FFFFFF;
  --carbon-700: #E7E3F2;
  --carbon-600: #D6D0E6;
  --carbon-500: #A8A0BC;
  --carbon-400: #6E667E;
  --carbon-300: #574F66;
  --carbon-200: #372F44;
  --carbon-100: #241E30;
  --carbon-50:  #160F22;

  /* Accent palette — light purple (was gold). Kept the --gold-* names so every
     component that references them switches automatically. */
  --gold-500: #8B5CF6;
  --gold-400: #A78BFA;
  --gold-300: #C4B5FD;
  --gold-600: #7C3AED;
  --gold-100: #EDE9FE;

  /* Semantic */
  --success: #16A34A;
  --danger:  #DC2626;
  --info:    #2563EB;
  --warning: #D97706;

  /* Gradients */
  --gradient-card: linear-gradient(135deg, #FFFFFF 0%, #F4F3F9 100%);
  --gradient-gold: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A78BFA 100%);
  --gradient-hero: linear-gradient(180deg, #FFFFFF 0%, #F4F3F9 40%, #EDE9FE 100%);

  /* Shadows */
  --shadow-card:     0 4px 20px rgba(80,60,140,0.10);
  --shadow-elevated: 0 8px 32px rgba(80,60,140,0.16);
  --shadow-gold:     0 0 20px rgba(139,92,246,0.35);

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
  color: var(--carbon-100);
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
