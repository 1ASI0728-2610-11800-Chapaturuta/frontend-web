import { BaseService } from '@/shared/services/base-service.js';
import { planTypeToInt, targetRoleToInt, billingCycleToInt } from '@/subscriptions/models/plan.entity.js';

/**
 * Servicio del contexto Subscriptions - Planes.
 * Endpoints reales en /api/v1/plans (ver PlansController.cs).
 * Extiende BaseService, que ya provee create/getAll/getById/update/patch/delete.
 */
export class PlanService extends BaseService {
    constructor() {
        // VITE_API_BASE_URL ya termina en /api/, por eso el prefijo es v1/ (no api/v1/).
        super('v1/plans');
    }

    /**
     * Crea un plan de suscripcion (solo Admin).
     * POST api/v1/plans (CreatePlanResource)
     * @param {Object} resource - CreatePlanResource: { name, planType, targetRole, price, currency, billingCycle, benefits, discoveryQuota }
     *   planType/targetRole/billingCycle pueden ser string; se convierten a int
     *   (PlanType/TargetRole/BillingCycle) porque el backend los exige como ENTEROS.
     * @returns {Promise<Object>} PlanResource creado (enums como string)
     */
    async create(resource) {
        const payload = {
            ...resource,
            planType: planTypeToInt(resource.planType),
            targetRole: targetRoleToInt(resource.targetRole),
            billingCycle: billingCycleToInt(resource.billingCycle)
        };
        return super.create(payload);
    }

    /**
     * Actualiza un plan existente (solo Admin).
     * PATCH api/v1/plans/{id} (UpdatePlanResource)
     * @param {number|string} id
     * @param {Object} resource - UpdatePlanResource: { price, benefits, discoveryQuota, isActive }
     * @returns {Promise<Object>} PlanResource actualizado
     */
    async update(id, resource) {
        return this.patch(id, resource);
    }

    /**
     * Lista todos los planes (activos e inactivos).
     * GET api/v1/plans
     * @returns {Promise<Array>} lista de PlanResource
     */
    async getAll() {
        return super.getAll();
    }

    /**
     * Obtiene un plan por su id.
     * GET api/v1/plans/{id}
     * @param {number|string} id
     * @returns {Promise<Object>} PlanResource
     */
    async getById(id) {
        return super.getById(id);
    }

    /**
     * Lista planes activos para un rol objetivo.
     * GET api/v1/plans/by-target-role/{role}
     * @param {string} role - TargetRole: Traveller | Driver | Both
     * @returns {Promise<Array>} lista de PlanResource activos
     */
    async getByTargetRole(role) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/by-target-role/${role}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}
