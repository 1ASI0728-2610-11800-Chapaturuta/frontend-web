import { BaseService } from '@/shared/services/base-service.js';

/**
 * Servicio del contexto Tariffs (bounded context Driver del backend).
 * Endpoints reales en /api/v1/tariffs.
 * Extiende BaseService, que ya provee create/getAll/getById/update/patch/delete.
 */
export class TariffService extends BaseService {
    constructor() {
        // BaseService construye la URL como serverBaseUrl + resourceEndpoint.
        // VITE_API_BASE_URL ya termina en /api/, por eso el prefijo es v1/ (no api/v1/).
        super('v1/tariffs');
    }

    /**
     * Crea una tarifa.
     * POST api/v1/tariffs (CreateTariffResource)
     * @param {Object} resource - CreateTariffResource (fkIdDriver, baseFare, pricePerKm,
     *                            pricePerMinute, minFare, currency, availableDays)
     * @returns {Promise<Object>} TariffResource creado
     */
    async create(resource) {
        return super.create(resource);
    }

    /**
     * Obtiene la tarifa activa de un conductor.
     * GET api/v1/tariffs/by-driver/{driverId}
     * @param {number|string} driverId
     * @returns {Promise<Object>} TariffResource (o lanza 404 si no existe)
     */
    async getByDriver(driverId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/by-driver/${driverId}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Actualiza una tarifa existente.
     * PATCH api/v1/tariffs/{id} (UpdateTariffResource)
     * @param {number|string} id
     * @param {Object} resource - UpdateTariffResource (baseFare, pricePerKm,
     *                            pricePerMinute, minFare, availableDays)
     * @returns {Promise<Object>} TariffResource actualizado
     */
    async update(id, resource) {
        return this.patch(id, resource);
    }

    /**
     * Define/actualiza la duracion estimada de una ruta bajo una tarifa.
     * POST api/v1/tariffs/{id}/route-durations (SetRouteDurationResource)
     * @param {number|string} id - id de la tarifa
     * @param {Object} resource - SetRouteDurationResource (fkIdRoute, estimatedMinutes)
     * @returns {Promise<Object>} RouteDurationResource
     */
    async setRouteDuration(id, resource) {
        try {
            const response = await this.http.post(
                `${this.resourcePath()}/${id}/route-durations`,
                JSON.stringify(resource)
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Obtiene la duracion estimada para un par conductor/ruta.
     * GET api/v1/tariffs/{driverId}/route-durations/{routeId}
     * @param {number|string} driverId
     * @param {number|string} routeId
     * @returns {Promise<Object>} RouteDurationResource (o lanza 404 si no existe)
     */
    async getRouteDuration(driverId, routeId) {
        try {
            const response = await this.http.get(
                `${this.resourcePath()}/${driverId}/route-durations/${routeId}`
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}
