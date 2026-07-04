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

            // /routes devuelve payloads pesados (geometría de ruta) — supera los 5s por defecto.
            const response = await this.http.get(`${this.resourcePath()}/district/${districtId}`, { timeout: 30000 });
            return response.data;
        }
        catch (error) {
            throw this._enhanceError(error);
        }
    }

    // Override: /routes es pesado (geometría), el timeout por defecto de BaseService (5s)
    // lo aborta. Usamos un timeout amplio solo para esta carga.
    async getAll() {
        try {
            const response = await this.http.get(this.resourcePath(), { timeout: 30000 });
            return response.data;
        }
        catch (error) {
            throw this._enhanceError(error);
        }
    }
}

// Exportamos una única instancia (singleton) para ser usada en la aplicación.
export const routeAlphaService = new RouteAlphaService();
