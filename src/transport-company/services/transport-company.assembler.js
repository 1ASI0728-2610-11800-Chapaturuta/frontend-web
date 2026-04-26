import {TransportCompany} from '../models/transport-company.entity.js';

export class TransportCompanyAssembler {
    /**
     * Convierte una Entidad a un objeto plano para respuestas HTTP.
     * @param {TransportCompany} company - Instancia de la entidad.
     * @returns {Object} Objeto compatible con la API.
     */
    static fromEntityToResponse(company) {
        if (!(company instanceof TransportCompany)) {
            throw new Error('Se requiere una instancia válida de TransportCompany');
        }

        return {
            id: company.id, // Siempre incluir el ID
            name: company.name,
            fk_id_manager: company.fk_id_manager,
            logo_url: company.logo_url,
            ruc: company.ruc,
            phone: company.phone,
            email: company.email,
            address: company.address,
            description: company.description,
            // Campos adicionales si la API los requiere:
            // ej: created_at: company.created_at
        };
    }

    /**
     * Convierte datos de la API (respuesta HTTP) a una Entidad.
     * @param {Object} apiData - Datos crudos de la API (ej: response.data).
     * @returns {TransportCompany} Nueva instancia de la entidad.
     */
    static fromResponseToEntity(apiData) {
        if (!apiData?.id) {
            throw new Error('Los datos de la API deben incluir un ID');
        }

        return new TransportCompany({
            id: apiData.id,
            name: apiData.name,
            fk_id_manager: apiData.fk_id_manager,
            logo_url: apiData.logo_url || null, // Defaults por si la API no envía el campo
            ruc: apiData.ruc || null,
            phone: apiData.phone || null,
            email: apiData.email || null,
            address: apiData.address || null,
            description: apiData.description || null
        });
    }
}