<script setup>
import {MapPinIcon} from "@heroicons/vue/16/solid/index.js";
import {ClockIcon} from "@heroicons/vue/16/solid/index.js";

defineProps({
  start:      { type: Object, required: true },
  routeInfo:  { type: Object, required: true },
  end:        { type: Object, required: true }
})
</script>

<template>
  <section class="card-stop-container">
    <img :src="start.image_url" alt="image-stop" class="card-stop-img" />
    <div class="card-stop-content">
      <h4>{{ start.name }}</h4>
      <p><span>Destino:</span> {{ end.name }}</p>
      <section>
        <div>
          <MapPinIcon class="icon" />
          <p>{{ start.address || start.google_maps_url }}</p>
        </div>
        <div>
          <ClockIcon class="icon" />
          <p>{{ routeInfo.duration_min }} min</p>
        </div>
      </section>
      <p class="card-stop-price">S/{{ routeInfo.price }}</p>
    </div>
  </section>
</template>

<style scoped>
/* Contenedor de cada tarjeta */
.card-stop-container {
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 280px;
  margin: 0.5rem;
  font-family: "Poppins", sans-serif;
}

/* Imagen principal */
.card-stop-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background-color: var(--carbon-700); /* placeholder */
}

/* Contenido interno */
.card-stop-content {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

/* Título */
.card-stop-content h4 {
  font-size: 1rem;
  margin: 0 0 0.25rem;
  font-weight: 600;
  color: var(--carbon-100);
}

/* Destino */
.card-stop-content p {
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  color: var(--carbon-400);
}
.card-stop-content p span {
  font-weight: 700;
  margin-right: 0.25rem;
  color: var(--carbon-200);
}

/* Sección de íconos */
.card-stop-content section {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  justify-content: space-between;
}
.card-stop-content section div {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.card-stop-content section div p{
  margin: 0px;
}
.card-stop-content .icon {
  width: 16px;
  height: 16px;
  color: var(--lilac-600);
}

/* Precio */
.card-stop-price {
  margin-top: auto;
  font-size: 1rem;
  font-weight: 700;
  color: var(--lilac-600);
}

</style>