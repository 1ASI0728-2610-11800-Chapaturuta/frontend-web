<script>
export default {
  name: "route-alpha-card",
  props: ['route', 'companyName']
}
</script>

<template>
  <router-link
    :to="{ name: 'route-detail', params: { id: route.id }, query: { routeData: JSON.stringify(route) } }"
    class="card-link"
  >
    <article class="route-card">
      <div class="card-image">
        <img :src="route.stops[0]?.image_url || 'https://picsum.photos/seed/route/300/180'" :alt="route.stops[0]?.name" @error="$event.target.src = 'https://picsum.photos/seed/route/300/180'" />
        <div class="card-badge">
          <i class="pi pi-map-marker"></i>
          {{ route.stops?.length || 0 }} paradas
        </div>
      </div>

      <div class="card-body">
        <h3 class="route-name">
          {{ route.stops[0]?.name }} → {{ route.stops[route.stops.length - 1]?.name }}
        </h3>
        <p class="company-name">
          <i class="pi pi-building"></i>
          {{ companyName }}
        </p>

        <div class="route-stats">
          <div class="stat">
            <i class="pi pi-clock"></i>
            <span>{{ route.duration }} min</span>
          </div>
          <div class="stat">
            <i class="pi pi-money-bill"></i>
            <span>S/ {{ route.price }}</span>
          </div>
        </div>
      </div>
    </article>
  </router-link>
</template>

<style scoped>
.card-link { text-decoration: none; display: block; }

.route-card {
  background: var(--carbon-800);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 280px;
  transition: border-color var(--duration-fast) ease, transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.route-card:hover {
  border-color: var(--gold-500);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(201,168,76,0.2);
}

.card-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-normal) ease;
}
.route-card:hover .card-image img { transform: scale(1.05); }

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--gold-400);
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.route-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--carbon-100);
  line-height: 1.3;
}
.company-name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--carbon-400);
}
.route-stats {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid var(--carbon-700);
}
.stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gold-400);
}
.stat i { font-size: 12px; color: var(--carbon-400); }
</style>
