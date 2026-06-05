/**
 * Entidad Plan. Campos camelCase EXACTOS de PlanResource
 * (Subscriptions/Interfaces/REST/Resources/PlanResource.cs) +
 * Subscriptions/Domain/Model/Aggregates/Plan.cs.
 *
 * Enums del backend (se serializan como string):
 *  - planType:    Free | Premium            (PlanType.cs)
 *  - targetRole:  Traveller | Driver | Both  (TargetRole.cs)
 *  - billingCycle: Monthly | Yearly          (BillingCycle)
 *  - currency:    ISO, por defecto PEN
 */
/**
 * Orden de declaracion de los enums del backend (indice = valor int). El backend
 * (System.Text.Json sin JsonStringEnumConverter) exige estos enums como ENTEROS
 * en CreatePlanResource. Las respuestas los devuelven como string (ToString()),
 * por eso solo se necesita string->int al enviar.
 *   PlanType.cs:     Free=0, Premium=1
 *   TargetRole.cs:   Traveller=0, Driver=1, Both=2
 *   BillingCycle.cs: Monthly=0, Yearly=1
 */
const PLAN_TYPE_ORDER = ['Free', 'Premium'];
const TARGET_ROLE_ORDER = ['Traveller', 'Driver', 'Both'];
const BILLING_CYCLE_ORDER = ['Monthly', 'Yearly'];

const _toIntBy = (order, value) => {
    if (typeof value === 'number') return value;
    const i = order.indexOf(value);
    return i >= 0 ? i : 0;
};

/** PlanType string ('Free'|'Premium') -> int. */
export const planTypeToInt = (v) => _toIntBy(PLAN_TYPE_ORDER, v);
/** TargetRole string ('Traveller'|'Driver'|'Both') -> int. */
export const targetRoleToInt = (v) => _toIntBy(TARGET_ROLE_ORDER, v);
/** BillingCycle string ('Monthly'|'Yearly') -> int. */
export const billingCycleToInt = (v) => _toIntBy(BILLING_CYCLE_ORDER, v);

export class Plan {
    constructor({
                    id = null,
                    name = '',
                    planType = 'Free',
                    targetRole = 'Both',
                    price = 0,
                    currency = 'PEN',
                    billingCycle = 'Monthly',
                    benefits = '',
                    discoveryQuota = null,
                    isActive = true
                } = {}) {
        this.id = id;
        this.name = name;
        this.planType = planType;
        this.targetRole = targetRole;
        this.price = price;
        this.currency = currency;
        this.billingCycle = billingCycle;
        this.benefits = benefits;
        // null => uso ilimitado (Premium)
        this.discoveryQuota = discoveryQuota;
        this.isActive = isActive;
    }

    /** True si el plan es gratuito. */
    get isFree() {
        return this.planType === 'Free' || Number(this.price) === 0;
    }

    /** True si la cuota Discovery es ilimitada. */
    get isUnlimitedDiscovery() {
        return this.discoveryQuota === null || this.discoveryQuota === undefined;
    }

    /** Precio formateado con moneda, ej. "PEN 29.90". */
    get formattedPrice() {
        if (this.isFree) return 'Gratis';
        return `${this.currency} ${Number(this.price).toFixed(2)}`;
    }

    /** Etiqueta legible del ciclo de facturacion. */
    get billingLabel() {
        return this.billingCycle === 'Yearly' ? 'al año' : 'al mes';
    }

    /** Lista de beneficios (el backend los guarda como texto; soporta separacion por salto de linea o ';'). */
    get benefitList() {
        if (!this.benefits) return [];
        return this.benefits
            .split(/\r?\n|;/)
            .map(b => b.trim())
            .filter(Boolean);
    }
}
