/**
 * Entidad Payment. Campos camelCase EXACTOS de PaymentResource
 * (Payments/Interfaces/REST/Resources/PaymentResource.cs).
 *
 * IMPORTANTE: el value object Money del backend se serializa APLANADO dentro
 * de PaymentResource como `amount` (decimal) + `currency` (string ISO),
 * NO como objeto anidado. Por eso aqui los modelamos como campos planos.
 */

/** Estados validos del pago (Payments/Domain/.../PaymentStatus). */
export const PaymentStatus = Object.freeze({
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
    PARTIALLY_REFUNDED: 'PartiallyRefunded'
});

/** Metodos de pago aceptados por CreatePaymentResource (PaymentMethod). */
export const PaymentMethod = Object.freeze({
    YAPE: 'Yape',
    PLIN: 'Plin',
    CARD: 'Card',
    CASH: 'Cash'
});

/**
 * Orden de declaracion de PaymentMethod.cs en el backend (indice = valor int):
 *   Yape=0, Plin=1, Card=2, Cash=3.
 * El backend (System.Text.Json sin JsonStringEnumConverter) exige el enum como
 * ENTERO en el request body. Las respuestas lo devuelven como string (ToString()),
 * por eso solo necesitamos string->int al enviar.
 */
const PAYMENT_METHOD_ORDER = ['Yape', 'Plin', 'Card', 'Cash'];

/**
 * Convierte un PaymentMethod string ('Yape'|'Plin'|'Card'|'Cash') a su indice
 * entero esperado por el backend. Si ya es numero, lo devuelve tal cual.
 * @param {string|number} method
 * @returns {number}
 */
export function paymentMethodToInt(method) {
    if (typeof method === 'number') return method;
    const i = PAYMENT_METHOD_ORDER.indexOf(method);
    return i >= 0 ? i : 0;
}

export class Payment {
    constructor({
                    id = null,
                    fkIdUser = null,
                    amount = 0,
                    currency = 'PEN',
                    method = PaymentMethod.CARD,
                    status = PaymentStatus.PENDING,
                    externalReference = null,
                    referenceType = '',   // Reservation | Subscription
                    referenceId = null,
                    createdAt = null,
                    confirmedAt = null
                } = {}) {
        this.id = id;
        this.fkIdUser = fkIdUser;
        this.amount = amount;
        this.currency = currency;
        this.method = method;
        this.status = status;
        this.externalReference = externalReference;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.createdAt = createdAt;
        this.confirmedAt = confirmedAt;
    }

    /** true si el pago esta a la espera de confirmacion de la pasarela. */
    get isPending() {
        return this.status === PaymentStatus.PENDING;
    }

    /** true si el pago se completo correctamente. */
    get isCompleted() {
        return this.status === PaymentStatus.COMPLETED;
    }

    /** true si el pago fallo. */
    get isFailed() {
        return this.status === PaymentStatus.FAILED;
    }

    /** true si el pago fue reembolsado (total o parcialmente). */
    get isRefunded() {
        return this.status === PaymentStatus.REFUNDED
            || this.status === PaymentStatus.PARTIALLY_REFUNDED;
    }

    /** Monto formateado con la moneda, ej. "PEN 25.00". */
    get formattedAmount() {
        const value = Number(this.amount ?? 0).toFixed(2);
        return `${this.currency ?? ''} ${value}`.trim();
    }
}
