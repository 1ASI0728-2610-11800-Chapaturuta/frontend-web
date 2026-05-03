# Frock — frontend web (ChapaTuRuta)

Aplicación Vue 3 + Vite + PrimeVue. Cliente del backend ASP.NET Core en `localhost:5027`.

UPC — Fundamentos de arquitectura de software. Plataforma de transporte público para áreas rurales del Perú.

---

## Inicio rápido

### Requisitos
- Node 20+ y npm
- Backend corriendo en `http://localhost:5027` (ver `backend/README.md`)

### Setup
```bash
cd Frontend/Frock-frontend-main/Frock-frontend-main/frontend-web
npm install
npm run dev -- --port 5173 --strictPort
```

App disponible en http://localhost:5173. El `--strictPort` evita que Vite salte a 5174 si 5173 está ocupado, lo cual romperia el CORS configurado en el backend.

Si ves el puerto ocupado:
```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Variables de entorno

Vite carga `.env`, `.env.development` (en `npm run dev`) y `.env.production` (en `npm run build`). El frontend solo necesita una variable:

| Variable | `.env.development` | `.env.production` |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5027/api/` | URL pública del backend |

> Importante: la URL **debe terminar con `/`**. Los services concatenan `${VITE_API_BASE_URL}${endpoint}`.

### Scripts

```bash
npm run dev           # Vite dev server con HMR
npm run build         # build de producción a /dist
npm run preview       # servir el build
npm run json-server   # mock server (legacy, no usado en producción)
```

---

## Stack

| Librería | Uso |
|---|---|
| Vue 3 (Composition + Options) | UI |
| Vite 6 | bundler + HMR |
| Vue Router 4 | rutas |
| PrimeVue 4 + PrimeFlex | componentes (Dialog, Button, AutoComplete, …) |
| Heroicons + PrimeIcons | iconos |
| axios | cliente HTTP |
| vue-i18n 9 | español/inglés |
| Leaflet 1.9 + `@vue-leaflet/vue-leaflet` | mapa OSM, marcadores, polylines |
| zod | validación |

---

## Estructura por bounded context

```
src/
├── access-and-identity/      # login, registro, AuthService
├── transport-company/        # empresa, perfil de empresa, dashboard manager
├── network/                  # paraderos, rutas, horarios (gestion del manager)
├── discovery/                # busqueda publica + "Cerca de mi"
├── traveller/                # perfil pasajero
├── trips/                    # historial de viajes
├── geography/                # regiones / provincias / distritos (catalogos)
├── ratings/                  # calificaciones
├── notifications/
├── collections/              # rutas favoritas
├── shared/
│   ├── services/             # BaseService (axios + interceptores), routes.js, map-config.service.js
│   └── components/           # AppToolbar, Layouts, MapView/MapPicker/MapWithMarkers
├── i18n/                     # en.json, es.json
├── router/                   # rutas + guards
└── main.js                   # registro PrimeVue + Leaflet bootstrap
```

`shared/services/base-service.js` es la base de todos los services: lee `VITE_API_BASE_URL`, agrega `Authorization: Bearer <token>` desde `localStorage.authToken` en cada request, y enriquece errores con `status`/`data`.

---

## Mapa OSM (Leaflet)

El frontend consume:

- **Tiles**: `GET /api/config/map` devuelve `{tileUrl, attribution, defaultCenter, defaultZoom, minZoom, maxZoom}`. La URL apunta al tile server self-hosted en `:8088` cuando está activo. Si falla la llamada, `map-config.service.js` cae automáticamente al tile público de OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). El mapa funciona con o sin tile server local.
- **Routing**: `POST /api/routes/preview`, `GET /api/routes/{id}/geometry` (OSRM).
- **Discovery**: `GET /api/discovery/nearby?lat=&lng=&radius=&useRoadDistance=`.

### Componentes compartidos

| Componente | Uso |
|---|---|
| `shared/components/MapView.vue` | wrapper genérico `LMap + LTileLayer` con slot |
| `shared/components/MapPicker.vue` | click/drag para fijar `{lat,lng}` + botón "Mi ubicación" + emite `update:modelValue` |
| `shared/components/MapWithMarkers.vue` | render de array de stops + polyline opcional |

### Dónde se usa

| Pantalla | Componente | Endpoint |
|---|---|---|
| `network/components/stop-popUps/new-stop-popup.component.vue` | `MapPicker` (obligatorio) | `POST /api/stops` con `Latitude`/`Longitude` |
| `network/pages/StopsPage.vue` | toggle Lista / `MapWithMarkers` | `GET /api/stops/company/{id}` |
| `network/components/route-card.component.vue` + `route-map-dialog.component.vue` | `MapWithMarkers` con polyline | `GET /api/routes/{id}/geometry` |
| `discovery/components/nearby-stops.component.vue` | geolocation + `MapWithMarkers` | `GET /api/discovery/nearby` |

### Distritos (autocomplete)

El selector de distrito en el form de paradero usa `pb-AutoComplete` (PrimeVue) que filtra los 1694 distritos del catálogo (`GET /api/geographic/{regions,provinces,districts}`). Búsqueda multi-token sobre `distrito + provincia + región`. Los datos vienen de un snapshot OSM embebido en el backend (ver `backend/README.md` sección "Setup automatizado").

---

## Decisiones / convenciones

- **Estilo CarbonGold**: paleta carbón + dorado definida en `main.js` (`definePreset(Aura, {...})`). Variables CSS en `assets/styles/variables.css`.
- **Auth**: token en `localStorage.authToken`. Login almacena `user = {id, username, role, companyId?}`.
- **Layouts por rol**:
  - Pasajero (`role = 0`) → `TravellerLayout`
  - Manager (`role = 1`) → `CompanyLayout` (incluye onboarding si no tiene empresa)
- **i18n**: `vue-i18n` con switch en `AppToolbar`. Llaves bajo `register.*`, `login.*`, etc.
- **Validación de formularios**: lógica manual + `zod` en algunos services. PrimeVue `<pb-Form>` (de `@primevue/forms`) requiere `:resolver` para emitir `submit`; sin él, usar `<form @submit.prevent>` y `type="button"` con `@click` en el botón principal.

---

## Troubleshooting frecuente

| Síntoma | Causa probable | Fix |
|---|---|---|
| `timeout of 5000ms exceeded` al hacer login/registro | `VITE_API_BASE_URL` apunta a otro puerto | Editar `.env.development` → `http://localhost:5027/api/`, reiniciar `npm run dev` |
| CORS bloquea `localhost:5174` | Vite saltó al 5174 porque 5173 estaba ocupado | Matar procesos en 5173 (ver arriba) y arrancar con `--strictPort` |
| `[Vue warn]: Invalid prop "icon": Expected Object, got Function` | Heroicons son render functions, no objetos | Prop debe aceptar `[Object, Function]` |
| `[Vue warn]: Component inside <Transition> renders non-element root` | Página con fragment como root | Envolver el template en un único `<div>` |
| Distrito sin opciones | DB vacía: API geográfica externa caída y backend nunca cargó el snapshot | Ver `backend/README.md`, sección "Setup automatizado" |

---

## Plan: Integración de mapa OSM — historial de fases

### Fases entregadas

| Fase | Alcance | Estado |
|---|---|---|
| 1 | `MapView`, `MapPicker`, `map-config.service`, integración en `new-stop-popup`, envío de `Latitude/Longitude` | ✅ |
| 2 | `MapWithMarkers` + toggle Lista/Mapa en `StopsPage` | ✅ |
| 3 | `route-map-dialog` con polyline (`/routes/{id}/geometry`) abierto desde `route-card` | ✅ |
| 4 | `nearby-stops` (geolocation + `/api/discovery/nearby`) en `routes-alpha-dashboard` | ✅ |
| Bonus | Autocomplete de distritos (PrimeVue AutoComplete) en form de paradero | ✅ |

### Archivos creados

```
src/shared/services/map-config.service.js
src/shared/components/MapView.vue
src/shared/components/MapPicker.vue
src/shared/components/MapWithMarkers.vue
src/network/components/route-map-dialog.component.vue
src/discovery/components/nearby-stops.component.vue
src/discovery/services/discovery-nearby.service.js
```

### Archivos modificados

- `src/main.js` — registro de `pb-AutoComplete`
- `src/network/services/stop.service.js` — envía `Latitude`/`Longitude` y autogenera `GoogleMapsUrl`
- `src/network/services/route.service.js` — `getGeometry`, `previewRoute`, decoder polyline/GeoJSON
- `src/network/components/stop-popUps/new-stop-popup.component.vue` — MapPicker + AutoComplete distritos
- `src/network/pages/StopsPage.vue` — toggle Lista/Mapa
- `src/network/components/route-card.component.vue` — botón "Ver mapa"
- `src/discovery/pages/routes-alpha-dashboard.vue` — incluye `<nearby-stops />`

### Pendientes / mejoras futuras

- Edit-stop popup todavía no integra `MapPicker` (replicar lo de new-stop).
- Form de creación de ruta podría llamar `previewRoute()` para mostrar geometry/distance/duration antes de guardar.
- Si la lista de paraderos crece >200, integrar `leaflet.markercluster`.
- Confirmar formato exacto de la `geometry` que devuelve el backend (string polyline / GeoJSON / array) y simplificar el decoder en `route.service.js` en consecuencia.
