/**
 * Entidad RouteDuration. Campos camelCase EXACTOS de RouteDurationResource
 * (Driver/Interfaces/REST/Resources/RouteDurationResource.cs).
 */
export class RouteDuration {
    constructor({
                    id = null,
                    fkIdTariff = null,
                    fkIdRoute = null,
                    estimatedMinutes = 0
                } = {}) {
        this.id = id;
        this.fkIdTariff = fkIdTariff;
        this.fkIdRoute = fkIdRoute;
        this.estimatedMinutes = estimatedMinutes;
    }

    /**
     * Construye el SetRouteDurationResource para
     * POST api/v1/tariffs/{id}/route-durations.
     * @returns {Object} SetRouteDurationResource (casing backend)
     */
    toSetResource() {
        return {
            fkIdRoute: this.fkIdRoute,
            estimatedMinutes: this.estimatedMinutes
        };
    }
}
