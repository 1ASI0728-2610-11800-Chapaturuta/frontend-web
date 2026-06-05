<template>
  <div class="tariff-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Gestión de Tarifas</h1>
        <p class="page-sub">Configura tu tarifa base y las duraciones estimadas por ruta</p>
      </div>
    </header>

    <pb-Message v-if="!driverId" severity="warn" :closable="false">
      No se encontró un conductor asociado a tu cuenta. Inicia sesión como conductor.
    </pb-Message>

    <template v-else>
      <pb-Message v-if="feedback.text" :severity="feedback.severity" :closable="true" @close="feedback.text = ''">
        {{ feedback.text }}
      </pb-Message>

      <!-- Tarifa -->
      <pb-Card class="surface-card">
        <template #title>
          <span class="card-title">{{ tariff.id ? 'Editar tarifa' : 'Crear tarifa' }}</span>
        </template>
        <template #content>
          <form class="tariff-form" @submit.prevent="saveTariff" novalidate>
            <div class="fields-grid">
              <div class="field-group">
                <label for="baseFare">Tarifa base</label>
                <pb-InputNumber
                    id="baseFare"
                    v-model="tariff.baseFare"
                    mode="currency"
                    :currency="tariff.currency || 'PEN'"
                    locale="es-PE"
                    :min="0"
                    :minFractionDigits="2"
                    fluid
                />
              </div>
              <div class="field-group">
                <label for="pricePerKm">Precio por km</label>
                <pb-InputNumber
                    id="pricePerKm"
                    v-model="tariff.pricePerKm"
                    mode="currency"
                    :currency="tariff.currency || 'PEN'"
                    locale="es-PE"
                    :min="0"
                    :minFractionDigits="2"
                    fluid
                />
              </div>
              <div class="field-group">
                <label for="pricePerMinute">Precio por minuto</label>
                <pb-InputNumber
                    id="pricePerMinute"
                    v-model="tariff.pricePerMinute"
                    mode="currency"
                    :currency="tariff.currency || 'PEN'"
                    locale="es-PE"
                    :min="0"
                    :minFractionDigits="2"
                    fluid
                />
              </div>
              <div class="field-group">
                <label for="minFare">Tarifa mínima</label>
                <pb-InputNumber
                    id="minFare"
                    v-model="tariff.minFare"
                    mode="currency"
                    :currency="tariff.currency || 'PEN'"
                    locale="es-PE"
                    :min="0"
                    :minFractionDigits="2"
                    fluid
                />
              </div>
              <div class="field-group">
                <label for="currency">Moneda</label>
                <pb-Select
                    id="currency"
                    v-model="tariff.currency"
                    :options="CURRENCIES"
                    placeholder="Selecciona la moneda"
                    fluid
                />
              </div>
            </div>

            <div class="field-group">
              <label>Días disponibles</label>
              <pb-SelectButton
                  v-model="tariff.availableDays"
                  :options="DAY_OPTIONS"
                  optionLabel="label"
                  optionValue="value"
                  multiple
                  aria-labelledby="days"
              />
            </div>

            <div class="form-actions">
              <pb-Button
                  type="submit"
                  :label="tariff.id ? 'Guardar cambios' : 'Crear tarifa'"
                  :loading="savingTariff"
                  icon="pi pi-save"
              />
            </div>
          </form>
        </template>
      </pb-Card>

      <!-- Duraciones por ruta -->
      <pb-Card class="surface-card">
        <template #title>
          <span class="card-title">Duraciones por ruta</span>
        </template>
        <template #content>
          <pb-Message v-if="!tariff.id" severity="info" :closable="false">
            Primero crea tu tarifa para poder definir las duraciones por ruta.
          </pb-Message>

          <template v-else>
            <form class="duration-form" @submit.prevent="saveRouteDuration" novalidate>
              <div class="fields-grid">
                <div class="field-group">
                  <label for="route">Ruta</label>
                  <pb-Select
                      id="route"
                      v-model="durationDraft.fkIdRoute"
                      :options="routeOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecciona una ruta"
                      :loading="loadingRoutes"
                      filter
                      fluid
                      @change="onRouteSelected"
                  />
                </div>
                <div class="field-group">
                  <label for="estimatedMinutes">Minutos estimados</label>
                  <pb-InputNumber
                      id="estimatedMinutes"
                      v-model="durationDraft.estimatedMinutes"
                      suffix=" min"
                      :min="0"
                      fluid
                  />
                </div>
              </div>
              <div class="form-actions">
                <pb-Button
                    type="submit"
                    label="Guardar duración"
                    :loading="savingDuration"
                    :disabled="!durationDraft.fkIdRoute"
                    icon="pi pi-clock"
                />
              </div>
            </form>

            <pb-DataTable
                :value="routeDurations"
                class="durations-table"
                dataKey="fkIdRoute"
                :emptyMessage="'Aún no has definido duraciones por ruta.'"
            >
              <pb-Column field="routeLabel" header="Ruta" />
              <pb-Column field="estimatedMinutes" header="Minutos estimados">
                <template #body="{ data }">{{ data.estimatedMinutes }} min</template>
              </pb-Column>
            </pb-DataTable>
          </template>
        </template>
      </pb-Card>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { Tariff } from '@/tariffs/models/tariff.entity.js'
import { TariffService } from '@/tariffs/services/tariff.service.js'
import { RouteService } from '@/network/services/route.service.js'

const tariffService = new TariffService()
const routeService = new RouteService()

const tariff = reactive(new Tariff({}))
const routes = ref([])
const routeDurations = ref([])

const durationDraft = reactive({ fkIdRoute: null, estimatedMinutes: 0 })

const savingTariff = ref(false)
const savingDuration = ref(false)
const loadingRoutes = ref(false)
const feedback = reactive({ text: '', severity: 'success' })

const CURRENCIES = ['PEN', 'USD']

// availableDays: el backend usa DayOfWeek en inglés (Monday..Sunday).
const DAY_OPTIONS = [
  { label: 'Lun', value: 'Monday' },
  { label: 'Mar', value: 'Tuesday' },
  { label: 'Mié', value: 'Wednesday' },
  { label: 'Jue', value: 'Thursday' },
  { label: 'Vie', value: 'Friday' },
  { label: 'Sáb', value: 'Saturday' },
  { label: 'Dom', value: 'Sunday' }
]

const getUser = () => JSON.parse(localStorage.getItem('user') || '{}')
const driverId = ref(getUser().driverId ?? null)

const routeLabel = (route) => {
  const stops = route?.stops ?? []
  const origin = stops[0]?.name ?? stops[0]?.address ?? null
  const destination = stops[stops.length - 1]?.name ?? stops[stops.length - 1]?.address ?? null
  if (origin && destination && stops.length > 1) return `${origin} → ${destination}`
  return `Ruta #${route?.id}`
}

const routeOptions = computed(() =>
    routes.value.map(r => ({ label: routeLabel(r), value: r.id }))
)

const flash = (text, severity = 'success') => {
  feedback.text = text
  feedback.severity = severity
}

const loadTariff = async () => {
  if (!driverId.value) return
  try {
    const data = await tariffService.getByDriver(driverId.value)
    if (data) Object.assign(tariff, new Tariff(data))
  } catch (err) {
    // 404 = el conductor aún no tiene tarifa; no es un error de UI.
    if (err?.status && err.status !== 404) {
      console.error('Error al cargar la tarifa:', err)
      flash('No se pudo cargar la tarifa.', 'error')
    }
  }
}

const loadRoutes = async () => {
  if (!driverId.value) return
  loadingRoutes.value = true
  try {
    const data = await routeService.getRoutesByDriverId(driverId.value)
    routes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error al cargar las rutas:', err)
  } finally {
    loadingRoutes.value = false
  }
}

const saveTariff = async () => {
  if (!driverId.value) return
  savingTariff.value = true
  try {
    tariff.fkIdDriver = driverId.value
    let data
    if (tariff.id) {
      data = await tariffService.update(tariff.id, tariff.toUpdateResource())
    } else {
      data = await tariffService.create(tariff.toCreateResource())
    }
    if (data) Object.assign(tariff, new Tariff(data))
    flash(tariff.id ? 'Tarifa actualizada correctamente.' : 'Tarifa creada correctamente.')
  } catch (err) {
    console.error('Error al guardar la tarifa:', err)
    flash(err?.data?.message ?? 'No se pudo guardar la tarifa.', 'error')
  } finally {
    savingTariff.value = false
  }
}

const onRouteSelected = async () => {
  if (!driverId.value || !durationDraft.fkIdRoute) return
  try {
    const data = await tariffService.getRouteDuration(driverId.value, durationDraft.fkIdRoute)
    durationDraft.estimatedMinutes = data?.estimatedMinutes ?? 0
  } catch (err) {
    // 404 = aún no hay duración para ese par; partimos de 0.
    if (err?.status && err.status !== 404) console.error('Error al cargar la duración:', err)
    durationDraft.estimatedMinutes = 0
  }
}

const upsertDurationRow = (routeId, estimatedMinutes) => {
  const label = routeOptions.value.find(o => o.value === routeId)?.label ?? `Ruta #${routeId}`
  const existing = routeDurations.value.find(d => d.fkIdRoute === routeId)
  if (existing) {
    existing.estimatedMinutes = estimatedMinutes
    existing.routeLabel = label
  } else {
    routeDurations.value.push({ fkIdRoute: routeId, estimatedMinutes, routeLabel: label })
  }
}

const saveRouteDuration = async () => {
  if (!tariff.id || !durationDraft.fkIdRoute) return
  savingDuration.value = true
  try {
    const data = await tariffService.setRouteDuration(tariff.id, {
      fkIdRoute: durationDraft.fkIdRoute,
      estimatedMinutes: durationDraft.estimatedMinutes
    })
    upsertDurationRow(durationDraft.fkIdRoute, data?.estimatedMinutes ?? durationDraft.estimatedMinutes)
    flash('Duración de ruta guardada.')
  } catch (err) {
    console.error('Error al guardar la duración:', err)
    flash(err?.data?.message ?? 'No se pudo guardar la duración.', 'error')
  } finally {
    savingDuration.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadTariff(), loadRoutes()])
})
</script>

<style scoped>
.tariff-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 960px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.02em;
}
.page-sub {
  font-size: 0.875rem;
  color: var(--carbon-500);
  margin-top: 4px;
}

.surface-card {
  background: var(--surface);
  border: 1px solid var(--carbon-700);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}
.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink);
}

.tariff-form,
.duration-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-group label {
  font-size: 11px;
  font-weight: 600;
  color: var(--carbon-500);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 1rem;
  border-top: 1px solid var(--carbon-700);
}

.durations-table {
  margin-top: 1.5rem;
}

:deep(.p-selectbutton .p-button.p-highlight) {
  background: var(--gold-600);
  border-color: var(--gold-600);
  color: var(--surface);
}
</style>
