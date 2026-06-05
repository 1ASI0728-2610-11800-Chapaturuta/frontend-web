/**
 * Entidad Refund. Campos camelCase EXACTOS de RefundResource
 * (Payments/Interfaces/REST/Resources/RefundResource.cs).
 *
 * Como en Payment, el Money del backend se aplana en `amount` + `currency`.
 */

/** Estados validos del reembolso (Payments/Domain/.../RefundStatus). */
export const RefundStatus = Object.freeze({
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed'
});

export class Refund {
    constructor({
                    id = null,
                    fkIdPayment = null,
                    amount = 0,
                    currency = 'PEN',
                    reason = '',
                    status = RefundStatus.PENDING,
                    createdAt = null,
                    confirmedAt = null
                } = {}) {
        this.id = id;
        this.fkIdPayment = fkIdPayment;
        this.amount = amount;
        this.currency = currency;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
        this.confirmedAt = confirmedAt;
    }

    /** Monto formateado con la moneda, ej. "PEN 10.00". */
    get formattedAmount() {
        const value = Number(this.amount ?? 0).toFixed(2);
        return `${this.currency ?? ''} ${value}`.trim();
    }
}
