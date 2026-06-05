import { BaseService } from '@/shared/services/base-service.js';

/**
 * Servicio del contexto Conductor (antes TransportCompany).
 * El backend refactorizo Company -> Driver. Endpoints reales en /api/v1/drivers.
 * Extiende BaseService, que ya provee create/getAll/getById/update/patch/delete.
 */
export class ConductorService extends BaseService {
    constructor() {
        // BaseService construye la URL como serverBaseUrl + resourceEndpoint.
        // VITE_API_BASE_URL ya termina en /api/, por eso el prefijo es v1/ (no api/v1/).
        super('v1/drivers');
    }

    /**
     * Crea un conductor.
     * POST api/v1/drivers (CreateDriverResource)
     * @param {Object} resource - CreateDriverResource (camelCase del backend)
     * @returns {Promise<Object>} DriverResource creado
     */
    async create(resource) {
        return super.create(resource);
    }

    /**
     * Lista todos los conductores.
     * GET api/v1/drivers
     * @returns {Promise<Array>} lista de DriverResource
     */
    async getAll() {
        return super.getAll();
    }

    /**
     * Obtiene un conductor por su id.
     * GET api/v1/drivers/{id}
     * @param {number|string} id
     * @returns {Promise<Object>} DriverResource
     */
    async getById(id) {
        return super.getById(id);
    }

    /**
     * Obtiene el conductor asociado a un usuario IAM.
     * GET api/v1/drivers/by-user/{userId}
     * Reemplaza al viejo getCompanyByFkUserId.
     * @param {number|string} userId - id del usuario IAM
     * @returns {Promise<Object>} DriverResource
     */
    async getByUserId(userId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/by-user/${userId}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Filtra conductores por tipo de vehiculo.
     * GET api/v1/drivers/by-vehicle-type/{vehicleType}
     * @param {string} vehicleType - Car | Pickup | Combi | Van | Bus | Minivan
     * @returns {Promise<Array>} lista de DriverResource
     */
    async getByVehicleType(vehicleType) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/by-vehicle-type/${vehicleType}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Lista conductores disponibles en un dia de la semana.
     * GET api/v1/drivers/available?day={day}
     * @param {string} day - DayOfWeek (Monday, Tuesday, ...)
     * @returns {Promise<Array>} lista de DriverResource
     */
    async getAvailable(day) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/available`, {
                params: { day }
            });
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Actualiza la informacion personal del conductor.
     * PATCH api/v1/drivers/{id} (UpdateDriverResource)
     * @param {number|string} id
     * @param {Object} resource - UpdateDriverResource (firstName, lastName, phone, photoUrl)
     * @returns {Promise<Object>} DriverResource actualizado
     */
    async updateDriver(id, resource) {
        return this.patch(id, resource);
    }

    /**
     * Actualiza el vehiculo del conductor.
     * PATCH api/v1/drivers/{id}/vehicle (UpdateVehicleResource)
     * @param {number|string} id
     * @param {Object} resource - UpdateVehicleResource (plate, brand, model, year, capacity, vehicleType)
     * @returns {Promise<Object>} DriverResource actualizado
     */
    async updateVehicle(id, resource) {
        return this.patch(id, resource, 'vehicle');
    }

    /**
     * Alterna la disponibilidad del conductor.
     * PATCH api/v1/drivers/{id}/availability
     * @param {number|string} id
     * @returns {Promise<Object>} DriverResource actualizado
     */
    async updateAvailability(id) {
        return this.patch(id, {}, 'availability');
    }

    /**
     * Elimina (soft-delete) un conductor.
     * DELETE api/v1/drivers/{id}
     * @param {number|string} id
     * @returns {Promise}
     */
    async delete(id) {
        return super.delete(id);
    }
}
