import { BaseService } from '@/shared/services/base-service.js'

/**
 * Servicio del contexto Trips (Viajes).
 * Endpoints reales en api/trips (TripsController: [Route("api/[controller]")]).
 * Extiende BaseService, que ya construye la URL como serverBaseUrl + resourceEndpoint.
 *
 * Nota: las RESERVAS (api/v1/reservations) son otro modulo y NO se manejan aqui.
 */
export class TripService extends BaseService {
    constructor() {
        // VITE_API_BASE_URL ya termina en /api/, por eso es 'trips' (no 'api/trips')
        super('trips')
    }

    /**
     * Registra un viaje.
     * POST api/trips (CreateTripResource)
     * Rol requerido: Traveller o Admin.
     * @param {Object} resource - CreateTripResource camelCase del backend:
     *   { fkIdUser, fkIdDriver?, fkIdRoute, fkIdOriginStop, fkIdDestinationStop, price?, availableSeats }
     * @returns {Promise<Object>} TripResource creado
     */
    async create(resource) {
        return super.create(resource)
    }

    /**
     * Obtiene un viaje por su id.
     * GET api/trips/{id}
     * @param {number|string} id
     * @returns {Promise<Object>} TripResource
     */
    async getById(id) {
        return super.getById(id)
    }

    /**
     * Historial de viajes de un pasajero.
     * GET api/trips/user/{userId}
     * @param {number|string} userId - id del usuario IAM
     * @returns {Promise<Array>} lista de TripResource
     */
    async getByUser(userId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
            return response.data
        } catch (error) {
            throw this._enhanceError(error)
        }
    }

    /**
     * Historial de viajes de un conductor.
     * GET api/trips/driver/{driverId}
     * @param {number|string} driverId - id del conductor
     * @returns {Promise<Array>} lista de TripResource
     */
    async getByDriver(driverId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`)
            return response.data
        } catch (error) {
            throw this._enhanceError(error)
        }
    }
}
