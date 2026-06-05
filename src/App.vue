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
  /* ── Tema claro: blanco + lila pastel ──
   * La rampa "carbon" se reutiliza con su SEMÁNTICA INVERTIDA: los componentes
   * usan los números altos (900/950) como fondo y los bajos (50/100) como texto.
   * Para pasar a tema claro sin tocar cada componente, invertimos los valores:
   *   900/950 = superficies claras (blanco)   |   50/100 = tinta oscura (texto)
   */
  --carbon-950: #FFFFFF;  /* base / fondo más claro */
  --carbon-900: #FFFFFF;  /* fondo principal (antes oscuro) */
  --carbon-800: #F7F5FB;  /* tarjetas / superficie elevada */
  --carbon-700: #ECE7F5;  /* bordes */
  --carbon-600: #DED7EC;  /* sutil / iconos suaves */
  --carbon-500: #8B8398;  /* texto medio */
  --carbon-400: #6E6780;  /* texto secundario (legible sobre blanco) */
  --carbon-300: #4A4458;  /* texto */
  --carbon-200: #332E40;  /* texto fuerte */
  --carbon-100: #1F1B2E;  /* texto principal (tinta) */
  --carbon-50:  #161320;  /* tinta más oscura */

  /* Lila pastel (acento principal — reemplaza al dorado) */
  --gold-500: #B7A6E0;  /* acento */
  --gold-400: #C4B5F0;  /* claro */
  --gold-300: #D8CEF2;  /* más claro */
  --gold-600: #9A86C9;  /* hover / oscuro */
  --gold-100: #F3EFFB;  /* tint */

  /* Alias semánticos de lila (uso directo recomendado en componentes nuevos) */
  --lilac-500: #B7A6E0;
  --lilac-400: #C4B5F0;
  --lilac-300: #D8CEF2;
  --lilac-600: #9A86C9;
  --lilac-100: #F3EFFB;
  --ink:       #1F1B2E;
  --surface:   #FFFFFF;

  /* Semantic */
  --success: #3BAE6E;
  --danger:  #E2566B;
  --info:    #4C8DF6;
  --warning: #E0A92E;

  /* Gradients (claros) */
  --gradient-card: linear-gradient(135deg, #FFFFFF 0%, #F7F5FB 100%);
  --gradient-gold: linear-gradient(135deg, #B7A6E0 0%, #C4B5F0 50%, #D8CEF2 100%);
  --gradient-hero: linear-gradient(180deg, #FFFFFF 0%, #F7F5FB 40%, #F3EFFB 100%);

  /* Shadows (suaves, tinte lila sobre fondo claro) */
  --shadow-card:     0 4px 24px rgba(124,106,176,0.12);
  --shadow-elevated: 0 8px 32px rgba(124,106,176,0.18);
  --shadow-gold:     0 0 20px rgba(183,166,224,0.40);

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
  background-color: var(--surface);
  color: var(--ink);
}

#app {
  width: 100%;
  min-height: 100vh;
  background-color: var(--surface);
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
