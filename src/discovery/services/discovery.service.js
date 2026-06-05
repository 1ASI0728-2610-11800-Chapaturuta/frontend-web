import { BaseService } from '@/shared/services/base-service.js'

/**
 * Error de cuota agotada del plan de suscripción (Discovery).
 * El backend responde HTTP 403 con { message } cuando se excede la cuota
 * del Plan Free. Distinguimos este caso para mostrar el upsell a Premium.
 */
export class DiscoveryQuotaError extends Error {
  constructor(message) {
    super(message || 'Plan Free agotado para Discovery. Suscríbase a Premium para uso ilimitado.')
    this.name = 'DiscoveryQuotaError'
    this.isQuotaExceeded = true
    this.status = 403
  }
}

/**
 * Servicio del contexto Discovery.
 *
 * IMPORTANTE sobre la URL: `VITE_API_BASE_URL` YA termina en `/api/`, y este
 * controlador vive en `/api/discovery` → por eso usamos `super('discovery')`
 * (sin prefijo `api/`). Mantiene la misma convención del servicio nearby previo.
 *
 * Todos los endpoints requieren `userId` para aplicar la cuota del plan de
 * suscripción. Si la cuota se excede, el backend responde 403 y aquí lo
 * normalizamos a {@link DiscoveryQuotaError} (`isQuotaExceeded === true`).
 *
 * Endpoints (base `discovery`):
 *  - GET discovery/search?userId=&origin=&destination=&date=
 *  - GET discovery/nearby?userId=&lat=&lng=&radius=2.0&useRoadDistance=false
 *  - GET discovery/popular?userId=&limit=10
 *  - GET discovery/analytics/demand?userId=&districtId=&period=
 */
export class DiscoveryService extends BaseService {
  constructor() {
    super('discovery')
  }

  /**
   * Convierte cualquier error de transporte en DiscoveryQuotaError cuando
   * el backend reporta cuota agotada (HTTP 403); en otro caso lo re-lanza.
   * @param {Error} error
   * @returns {never}
   */
  _handleError(error) {
    if (error?.status === 403) {
      const message = error?.data?.message
      throw new DiscoveryQuotaError(message)
    }
    throw error
  }

  /**
   * Busca rutas por origen/destino (y fecha opcional). Si se envían tanto
   * origin como destination, cada match incluye estimación OSRM de distancia
   * y duración.
   *
   * La respuesta del backend es una lista de
   * `{ route, estimatedDistanceMeters, estimatedDurationSeconds }`.
   *
   * @param {Object} params
   * @param {number|string} params.userId - Usuario cuya cuota se consume (requerido).
   * @param {string} [params.origin] - Texto de paradero/dirección de origen.
   * @param {string} [params.destination] - Texto de paradero/dirección de destino.
   * @param {string} [params.date] - Fecha (opcional, formato libre que acepte el backend).
   * @returns {Promise<Array<{route:Object, estimatedDistanceMeters:?number, estimatedDurationSeconds:?number}>>}
   */
  async search({ userId, origin, destination, date } = {}) {
    try {
      const params = { userId }
      if (origin) params.origin = origin
      if (destination) params.destination = destination
      if (date) params.date = date
      const response = await this.http.get(`${this.resourcePath()}/search`, { params })
      return response.data
    } catch (error) {
      this._handleError(error)
    }
  }

  /**
   * Igual que {@link search} pero devuelve solo las rutas (sin el wrapper de
   * estimaciones), listas para alimentar `routes-alpha-list`.
   * @param {Object} params - mismos que {@link search}.
   * @returns {Promise<Array<Object>>}
   */
  async searchRoutes(params = {}) {
    const results = await this.search(params)
    return (results || []).map((item) => (item && item.route ? item.route : item))
  }

  /**
   * Encuentra paraderos cercanos a unas coordenadas.
   * NOTA: el backend interpreta `radius` en KILÓMETROS (default 2.0).
   *
   * @param {Object} params
   * @param {number|string} params.userId - Usuario cuya cuota se consume (requerido).
   * @param {number} params.lat - Latitud.
   * @param {number} params.lng - Longitud.
   * @param {number} [params.radius=2.0] - Radio en km.
   * @param {boolean} [params.useRoadDistance=false] - Ordenar por distancia por carretera (OSRM).
   * @returns {Promise<Array<Object>>} Paraderos ordenados por distancia.
   */
  async nearby({ userId, lat, lng, radius = 2.0, useRoadDistance = false } = {}) {
    try {
      const params = { userId, lat, lng, radius, useRoadDistance }
      const response = await this.http.get(`${this.resourcePath()}/nearby`, { params })
      return response.data
    } catch (error) {
      this._handleError(error)
    }
  }

  /**
   * Rutas más populares según número de viajes.
   * Devuelve `RouteAggregateResource[]` (mismo shape que `routes-alpha-list`).
   *
   * @param {Object} params
   * @param {number|string} params.userId - Usuario cuya cuota se consume (requerido).
   * @param {number} [params.limit=10] - Cantidad máxima de rutas.
   * @returns {Promise<Array<Object>>}
   */
  async popular({ userId, limit = 10 } = {}) {
    try {
      const params = { userId, limit }
      const response = await this.http.get(`${this.resourcePath()}/popular`, { params })
      return response.data
    } catch (error) {
      this._handleError(error)
    }
  }

  /**
   * Analítica de demanda agrupada por hora y por día de la semana.
   * Respuesta: { districtId, period, totalTrips, demandByHour:[{hour,count}], demandByDay:[{day,count}] }.
   *
   * @param {Object} params
   * @param {number|string} params.userId - Usuario cuya cuota se consume (requerido).
   * @param {number} [params.districtId] - Filtra por distrito (opcional).
   * @param {string} [params.period] - Periodo (opcional; default backend = "all").
   * @returns {Promise<Object>}
   */
  async analyticsDemand({ userId, districtId, period } = {}) {
    try {
      const params = { userId }
      if (districtId !== undefined && districtId !== null && districtId !== '') params.districtId = districtId
      if (period) params.period = period
      const response = await this.http.get(`${this.resourcePath()}/analytics/demand`, { params })
      return response.data
    } catch (error) {
      this._handleError(error)
    }
  }
}

// Instancia singleton para uso directo en componentes.
export const discoveryService = new DiscoveryService()
