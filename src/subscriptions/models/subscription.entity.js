/**
 * Entidad Subscription. Campos camelCase EXACTOS de SubscriptionResource
 * (Subscriptions/Interfaces/REST/Resources/SubscriptionResource.cs) +
 * Subscriptions/Domain/Model/Aggregates/Subscription.cs.
 *
 * Enum del backend (se serializa como string):
 *  - status: Active | Expired | Cancelled | PendingPayment  (SubscriptionStatus.cs)
 */
export class Subscription {
    constructor({
                    id = null,
                    fkIdUser = null,
                    fkIdPlan = null,
                    status = 'PendingPayment',
                    startsAt = null,
                    endsAt = null,
                    autoRenew = false,
                    fkIdPayment = null,
                    discoveryUsageInCycle = 0
                } = {}) {
        this.id = id;
        this.fkIdUser = fkIdUser;
        this.fkIdPlan = fkIdPlan;
        this.status = status;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.autoRenew = autoRenew;
        this.fkIdPayment = fkIdPayment;
        this.discoveryUsageInCycle = discoveryUsageInCycle;
    }

    /** True si la suscripcion esta vigente. */
    get isActive() {
        return this.status === 'Active';
    }

    /** True si esta a la espera de pago (Premium). */
    get isPendingPayment() {
        return this.status === 'PendingPayment';
    }

    /** True si fue cancelada. */
    get isCancelled() {
        return this.status === 'Cancelled';
    }

    /** True si vencio. */
    get isExpired() {
        return this.status === 'Expired';
    }

    /** Fecha de inicio formateada (locale es-PE) o '—'. */
    get startsAtLabel() {
        return this._formatDate(this.startsAt);
    }

    /** Fecha de fin formateada (locale es-PE) o '—'. */
    get endsAtLabel() {
        return this._formatDate(this.endsAt);
    }

    _formatDate(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}
