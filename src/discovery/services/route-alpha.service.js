import { BaseService } from '@/shared/services/base-service.js';

export class RouteAlphaService extends BaseService {
    constructor() {
        super('routes');
    }

    async getRoutesByDistrictId(districtId) {
        try {
            if (!districtId || typeof districtId !== 'string') {
                throw new Error('ID de distrito inválido');
            }

            // Usar el endpoint específico para obtener rutas por ID de distrito
            const response = await this.http.get(`${this.resourcePath()}/district/${districtId}`);
            return response.data;
        }
        catch (error) {
            throw this._enhanceError(error);
        }
    }

    // No es necesario definir getAll() aquí, ya que se hereda de BaseService.
}

// Exportamos una única instancia (singleton) para ser usada en la aplicación.
export const routeAlphaService = new RouteAlphaService();
