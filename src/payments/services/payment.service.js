import { BaseService } from '@/shared/services/base-service.js';
import { paymentMethodToInt } from '@/payments/models/payment.entity.js';

/**
 * Servicio del contexto Payments.
 * Endpoints reales en /api/v1/payments (PaymentsController.cs).
 * Extiende BaseService, que ya provee create/getById sobre resourcePath().
 *
 * VITE_API_BASE_URL ya termina en /api/, por eso el prefijo es v1/ (no api/v1/).
 * Mismo criterio que ConductorService (super('v1/drivers')).
 */
export class PaymentService extends BaseService {
    constructor() {
        super('v1/payments');
    }

    /**
     * Crea un pago.
     * POST api/v1/payments (CreatePaymentResource).
     * @param {Object} resource - CreatePaymentResource:
     *   { fkIdUser, amount, currency, method, referenceType, referenceId }
     *   `method` puede ser string ('Yape'|'Plin'|'Card'|'Cash'); se convierte a
     *   int (PaymentMethod) porque el backend exige el enum como ENTERO.
     * @returns {Promise<Object>} PaymentResource creado (status: Pending; enums como string)
     */
    async create(resource) {
        const payload = {
            ...resource,
            method: paymentMethodToInt(resource.method)
        };
        return super.create(payload);
    }

    /**
     * Confirma un pago con la referencia externa emitida por la pasarela.
     * POST api/v1/payments/{id}/confirm (ConfirmPaymentResource).
     * @param {number|string} id - id del pago
     * @param {Object} payload - { externalReference }
     * @returns {Promise<Object>} PaymentResource (status: Completed)
     */
    async confirm(id, { externalReference }) {
        try {
            const response = await this.http.post(
                `${this.resourcePath()}/${id}/confirm`,
                JSON.stringify({ externalReference })
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Marca un pago como fallido.
     * POST api/v1/payments/{id}/fail (sin body).
     * @param {number|string} id - id del pago
     * @returns {Promise<Object>} PaymentResource (status: Failed)
     */
    async fail(id) {
        try {
            const response = await this.http.post(`${this.resourcePath()}/${id}/fail`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Crea un reembolso para un pago.
     * POST api/v1/payments/{id}/refunds (CreateRefundResource).
     * @param {number|string} id - id del pago
     * @param {Object} resource - CreateRefundResource: { amount, reason }
     * @returns {Promise<Object>} RefundResource creado
     */
    async refund(id, resource) {
        try {
            const response = await this.http.post(
                `${this.resourcePath()}/${id}/refunds`,
                JSON.stringify(resource)
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Obtiene un pago por su id.
     * GET api/v1/payments/{id}.
     * @param {number|string} id
     * @returns {Promise<Object>} PaymentResource
     */
    async getById(id) {
        return super.getById(id);
    }

    /**
     * Lista los pagos de un usuario.
     * GET api/v1/payments/user/{userId}.
     * @param {number|string} userId - id del usuario IAM (fkIdUser)
     * @returns {Promise<Array>} lista de PaymentResource
     */
    async getByUser(userId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/user/${userId}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Lista los reembolsos asociados a un pago.
     * GET api/v1/payments/{id}/refunds.
     * @param {number|string} id - id del pago
     * @returns {Promise<Array>} lista de RefundResource
     */
    async getRefunds(id) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/${id}/refunds`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}
