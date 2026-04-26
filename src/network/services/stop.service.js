import { BaseService } from '@/shared/services/base-service.js';
import { StopEntity } from '../models/stop.entity';
import { GeographyService } from "@/geography/services/geography.service.js";

export class StopService extends BaseService {
    constructor() {
        super('stops');
        this.geographyService = new GeographyService();
        this.companyService = new BaseService('companies');
    }

    /**
     * Obtiene paraderos por ID de compañía con información enriquecida
     * @param {int} companyId - ID de la compañía
     * @returns {Promise<Array>} Lista de paraderos con datos completos
     */
    async getStopsByCompanyId(companyId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/company/${companyId}`);
            const stops = response.data;

            // Enriquecer cada paradero con información adicional
            return Promise.all(
                stops.map(async stop => {
                    try {
                        const locationDetails = await this.geographyService.getLocationDetails(stop.fkIdDistrict);
                        const companyName = await this._getCompanyName(stop.fkIdCompany);

                        return {
                            ...stop,
                            location: locationDetails?.fullPath || 'Ubicación no disponible',
                            companyName: companyName || 'Empresa no disponible'
                        };
                    } catch (error) {
                        console.warn(`Error enriqueciendo datos del paradero ${stop.id}:`, error);
                        return {
                            ...stop,
                            location: 'Ubicación no disponible',
                            companyName: 'Empresa no disponible'
                        };
                    }
                })
            );
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Obtiene paraderos formateados para uso en componentes de selección (Dropdown/Select)
     * @param {int} companyId - ID de la compañía
     * @returns {Promise<Array<{label: string, value: string}>>}
     */
    async getStopsForSelect(companyId) {
        try {
            if (!companyId) {
                throw new Error('ID de compañía inválido');
            }
            const response = await this.http.get(`${this.resourcePath()}/company/${companyId}`);
            const stops = response.data;

            return stops.map(stop => ({
                label: stop.name,
                value: stop.id,
            }));
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Elimina un paradero
     * @param {int} id - ID del paradero
     * @returns {Promise<void>}
     */
    async deleteStop(id) {
        try {
            if (!id || typeof id !== 'number' ||
                !Number.isInteger(id) ||
                id < 0) {
                throw new Error('ID de paradero inválido');
            }
            await super.delete(id);
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Actualiza un paradero
     * @param {int} id - ID del paradero
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<StopEntity>}
     */
    async updateStop(id, updateData) {
        try {
            if (!id || typeof id !== 'number' ||
                !Number.isInteger(id) ||
                id < 0) {
                throw new Error('ID de paradero inválido');
            }
            this._validateStopData(updateData);

            const companyId = this._getCompanyIdFromLocalStorage();
            const current = await super.getById(id);

            const updatedData = {
                id: Number(current.id),
                name: updateData.name,
                googleMapsUrl: current.googleMapsUrl,
                imageUrl: current.imageUrl,
                phone: updateData.phone,
                fkIdCompany: Number(companyId),
                address: updateData.address,
                reference: updateData.reference,
                fkIdDistrict: updateData.fk_id_district
            };

            const response = await super.update(id, updatedData);

            return new StopEntity(
                response.id,
                response.name,
                response.googleMapsUrl,
                response.imageUrl,
                response.phone,
                response.fkIdCompany,
                response.fkIdDistrict,
                response.address,
                response.reference,
            );
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Crea un nuevo paradero con soporte para archivos
     * @param {Object} stopData - Datos del paradero
     * @returns {Promise<StopEntity>}
     */
    async createStop(stopData) {
        try {
            // Validaciones
            this._validateStopData(stopData);

            const companyId = this._getCompanyIdFromLocalStorage();

            // Crear FormData para enviar archivos
            const formData = new FormData();

            // Agregar campos de texto
            formData.append('Name', stopData.name);
            formData.append('Phone', stopData.phone);
            formData.append('Address', stopData.address);
            formData.append('Reference', stopData.reference);
            formData.append('FkIdCompany', companyId.toString());
            formData.append('FkIdDistrict', stopData.fk_id_district);
            formData.append('GoogleMapsUrl', stopData.google_maps_url || '');

            // Agregar archivo si existe
            if (stopData.imageFile) {
                formData.append('ImageFile', stopData.imageFile);
            }

            // Log para debugging
            console.log('Enviando datos del paradero:', {
                name: stopData.name,
                phone: stopData.phone,
                address: stopData.address,
                reference: stopData.reference,
                companyId: companyId,
                district: stopData.fk_id_district,
                hasImage: !!stopData.imageFile
            });

            const response = await this.http.post(this.resourcePath(), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log("Paradero creado exitosamente:", response.data);

            return new StopEntity(
                response.data.id,
                response.data.name,
                response.data.googleMapsUrl,
                response.data.imageUrl,
                response.data.phone,
                response.data.fkIdCompany,
                response.data.fkIdDistrict,
                response.data.address,
                response.data.reference,
            );
        } catch (error) {
            console.error('Error al crear paradero:', error);
            throw this._enhanceError(error);
        }
    }

    async _getCompanyName(companyId) {
        try {
            const company = await this.companyService.getById(companyId);
            return company?.name || 'Desconocido';
        } catch {
            return 'Desconocido';
        }
    }

    _validateStopData(data) {
        const requiredFields = {
            name: 'string',
            phone: 'string',
            address: 'string',
            reference: 'string'
        };

        Object.entries(requiredFields).forEach(([field, type]) => {
            if (!data[field] || typeof data[field] !== type) {
                throw new Error(`Campo requerido: ${field} (debe ser ${type})`);
            }
        });
    }

    _getCompanyIdFromLocalStorage() {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData.companyId) {
                throw new Error('No se encontró ID de compañía en el usuario autenticado');
            }
            return Number(userData.companyId);
        } catch (error) {
            console.error('Error al obtener companyId del localStorage:', error);
            throw new Error('No se pudo obtener el ID de la compañía');
        }
    }

    _enhanceError(error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.message;

            switch (status) {
                case 400:
                    return new Error(`Datos inválidos: ${message}`);
                case 401:
                    return new Error('No autorizado. Por favor, inicia sesión nuevamente.');
                case 403:
                    return new Error('No tienes permisos para realizar esta acción.');
                case 404:
                    return new Error('Recurso no encontrado.');
                case 500:
                    return new Error('Error interno del servidor. Intenta nuevamente.');
                default:
                    return new Error(`Error ${status}: ${message}`);
            }
        }

        if (error.request) {
            return new Error('Error de conexión. Verifica tu conexión a internet.');
        }

        return error;
    }
}