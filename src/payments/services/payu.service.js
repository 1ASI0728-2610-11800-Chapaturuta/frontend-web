import { BaseService } from '@/shared/services/base-service.js';

/**
 * Servicio del gateway PayU.
 * Endpoint real en /api/v1/payments/payu (PayUController.cs).
 *
 * VITE_API_BASE_URL ya termina en /api/, por eso el prefijo es v1/ (no api/v1/).
 *
 * NOTA: el webhook de confirmacion de PayU (POST /payu/webhook) es backend-only
 * (lo invoca PayU, no el frontend). Aqui solo exponemos el cargo con token.
 */
export class PayUService extends BaseService {
    constructor() {
        super('v1/payments/payu');
    }

    /**
     * Carga una tarjeta tokenizada via PayU para un pago existente.
     * POST api/v1/payments/payu/{paymentId}/charge (PayUChargeResource).
     *
     * El backend, si el cargo es exitoso y devuelve externalReference,
     * confirma el pago internamente (no hace falta llamar a confirm aparte).
     *
     * @param {number|string} paymentId - id del pago previamente creado
     * @param {Object} resource - PayUChargeResource (camelCase):
     *   {
     *     cardToken,            // generado por PayU JS en el frontend (ver TODO)
     *     payerFullName,
     *     payerEmail,
     *     payerDocumentNumber,
     *     paymentMethodBrand,   // VISA | MASTERCARD | AMEX | DINERS
     *     payerIpAddress,
     *     deviceSessionId,      // generado por PayU JS (antifraude)
     *     payerUserAgent,
     *     payerCookie
     *   }
     * @returns {Promise<Object>} { paymentId, externalReference, message }
     */
    async charge(paymentId, resource) {
        try {
            const response = await this.http.post(
                `${this.resourcePath()}/${paymentId}/charge`,
                JSON.stringify(resource)
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}
