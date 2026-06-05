import { BaseService } from '@/shared/services/base-service.js';
import { paymentMethodToInt } from '@/payments/models/payment.entity.js';

/**
 * Servicio del contexto Subscriptions - Suscripciones.
 * Endpoints reales en /api/v1/subscriptions (ver SubscriptionsController.cs).
 * Extiende BaseService, que ya provee create/getAll/getById/update/patch/delete.
 */
export class SubscriptionService extends BaseService {
    constructor() {
        // VITE_API_BASE_URL ya termina en /api/, por eso el prefijo es v1/ (no api/v1/).
        super('v1/subscriptions');
    }

    /**
     * Suscribe un usuario a un plan.
     * POST api/v1/subscriptions (SubscribeToPlanResource)
     * @param {Object} resource - { fkIdUser, fkIdPlan, autoRenew, paymentMethod }
     *   `paymentMethod` puede ser string; se convierte a int (PaymentMethod) porque
     *   el backend exige el enum como ENTERO.
     * @returns {Promise<Object>} SubscriptionResource creado (status como string)
     */
    async create(resource) {
        const payload = {
            ...resource,
            paymentMethod: paymentMethodToInt(resource.paymentMethod)
        };
        return super.create(payload);
    }

    /**
     * Cancela una suscripcion.
     * POST api/v1/subscriptions/{id}/cancel
     * @param {number|string} id
     * @returns {Promise<Object>} SubscriptionResource cancelado
     */
    async cancel(id) {
        try {
            const response = await this.http.post(`${this.resourcePath()}/${id}/cancel`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Renueva una suscripcion existente.
     * POST api/v1/subscriptions/{id}/renew (RenewSubscriptionResource)
     * @param {number|string} id
     * @param {Object} payload - { paymentMethod }: PaymentMethod (Yape | Plin | Card | Cash)
     * @returns {Promise<Object>} SubscriptionResource renovado
     */
    async renew(id, { paymentMethod }) {
        try {
            // RenewSubscriptionResource.PaymentMethod es enum -> ENTERO en backend.
            const response = await this.http.post(
                `${this.resourcePath()}/${id}/renew`,
                JSON.stringify({ paymentMethod: paymentMethodToInt(paymentMethod) })
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Obtiene la suscripcion activa de un usuario.
     * GET api/v1/subscriptions/active/by-user/{userId}
     * @param {number|string} userId - id del usuario IAM
     * @returns {Promise<Object|null>} SubscriptionResource o null si no tiene activa (404)
     */
    async getActiveByUser(userId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/active/by-user/${userId}`);
            return response.data;
        } catch (error) {
            // El backend devuelve 404 cuando el usuario no tiene suscripcion activa.
            if (error?.response?.status === 404) return null;
            throw this._enhanceError(error);
        }
    }

    /**
     * Obtiene el historial completo de suscripciones de un usuario.
     * GET api/v1/subscriptions/history/by-user/{userId}
     * @param {number|string} userId - id del usuario IAM
     * @returns {Promise<Array>} lista de SubscriptionResource
     */
    async getHistoryByUser(userId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/history/by-user/${userId}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}
