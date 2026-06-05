import { BaseService } from '@/shared/services/base-service.js'
import { ReservationAssembler } from '@/reservations/services/reservation.assembler.js'

/**
 * Servicio del contexto Reservations (Reservas de asientos).
 * Endpoints reales en /api/v1/reservations
 * (ReservationsController: [Route("api/v1/[controller]")]).
 *
 * VITE_API_BASE_URL ya termina en /api/, por eso el prefijo es 'v1/reservations'
 * (NO 'api/v1/reservations'). Ver conductor.service.js (super('v1/drivers')).
 *
 * Extiende BaseService, que ya construye la URL como serverBaseUrl + resourceEndpoint
 * y provee create/getById vía super.
 */
export class ReservationService extends BaseService {
    constructor() {
        super('v1/reservations')
    }

    /**
     * Crea una reserva en estado Pending.
     * POST api/v1/reservations (CreateReservationResource)
     * Rol requerido: Traveller o Admin.
     * El backend descuenta asientos del Trip y registra el pago pendiente
     * internamente (BC Payments vía ACL), por eso fkIdPayment NO se envía aquí.
     * @param {Object} resource - datos del formulario camelCase:
     *   { fkIdUser, fkIdTrip, documentType, documentNumber, seats, paymentMethod }
     *   documentType: 'Dni' (UNICO)  ·  paymentMethod: 'Yape' | 'Plin' | 'Card' | 'Cash'
     *
     * El backend espera los enums como ENTEROS, por eso convertimos string->int
     * con ReservationAssembler antes de enviar. La respuesta (enums como int)
     * se normaliza int->string a entidad Reservation.
     * @returns {Promise<Reservation>} reserva creada
     */
    async create(resource) {
        const payload = ReservationAssembler.fromEntityToCreateResource(resource)
        const raw = await super.create(payload)
        return ReservationAssembler.fromResponseToEntity(raw)
    }

    /**
     * Confirma una reserva (marca Confirmed tras validar el pago asociado).
     * POST api/v1/reservations/{id}/confirm
     * @param {number|string} id
     * @returns {Promise<Object>} ReservationResource actualizada
     */
    async confirm(id) {
        try {
            const response = await this.http.post(`${this.resourcePath()}/${id}/confirm`)
            return ReservationAssembler.fromResponseToEntity(response.data)
        } catch (error) {
            throw this._enhanceError(error)
        }
    }

    /**
     * Cancela una reserva (libera asientos del Trip; si estaba Confirmed
     * con pago asociado, registra un reembolso en el BC Payments).
     * POST api/v1/reservations/{id}/cancel
     * @param {number|string} id
     * @returns {Promise<Object>} ReservationResource actualizada
     */
    async cancel(id) {
        try {
            const response = await this.http.post(`${this.resourcePath()}/${id}/cancel`)
            return ReservationAssembler.fromResponseToEntity(response.data)
        } catch (error) {
            throw this._enhanceError(error)
        }
    }

    /**
     * Obtiene una reserva por su id.
     * GET api/v1/reservations/{id}
     * @param {number|string} id
     * @returns {Promise<Reservation>} reserva (enums normalizados int->string)
     */
    async getById(id) {
        const raw = await super.getById(id)
        return ReservationAssembler.fromResponseToEntity(raw)
    }

    /**
     * Lista las reservas de un usuario pasajero (más reciente a más antigua).
     * GET api/v1/reservations/by-user/{userId}
     * @param {number|string} userId - id del usuario IAM
     * @returns {Promise<Array>} lista de ReservationResource
     */
    async getByUser(userId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/by-user/${userId}`)
            const list = Array.isArray(response.data) ? response.data : []
            return list.map((r) => ReservationAssembler.fromResponseToEntity(r))
        } catch (error) {
            throw this._enhanceError(error)
        }
    }

    /**
     * Lista las reservas asociadas a un Trip.
     * GET api/v1/reservations/by-trip/{tripId}
     * @param {number|string} tripId
     * @returns {Promise<Array>} lista de ReservationResource
     */
    async getByTrip(tripId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/by-trip/${tripId}`)
            const list = Array.isArray(response.data) ? response.data : []
            return list.map((r) => ReservationAssembler.fromResponseToEntity(r))
        } catch (error) {
            throw this._enhanceError(error)
        }
    }

    /**
     * Lista las reservas de los viajes asignados a un conductor.
     * GET api/v1/reservations/by-driver/{driverId}
     * @param {number|string} driverId - id del conductor
     * @returns {Promise<Array>} lista de ReservationResource
     */
    async getByDriver(driverId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/by-driver/${driverId}`)
            const list = Array.isArray(response.data) ? response.data : []
            return list.map((r) => ReservationAssembler.fromResponseToEntity(r))
        } catch (error) {
            throw this._enhanceError(error)
        }
    }
}
