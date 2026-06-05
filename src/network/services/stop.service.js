import { BaseService } from '@/shared/services/base-service.js';
import { StopEntity } from '../models/stop.entity';
import { GeographyService } from "@/geography/services/geography.service.js";

export class StopService extends BaseService {
    constructor() {
        super('stops');
        this.geographyService = new GeographyService();
        // El backend eliminó el bounded context "companies"; las paradas ahora se
        // asocian a un driver. Ya no se instancia BaseService('companies').
    }

    /**
     * Obtiene paraderos por ID de conductor con información enriquecida
     * @param {int} driverId - ID del conductor
     * @returns {Promise<Array>} Lista de paraderos con datos completos
     */
    async getStopsByDriverId(driverId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`);
            const stops = response.data;

            // Enriquecer cada paradero con información de ubicación (distrito/provincia/región)
            return Promise.all(
                stops.map(async stop => {
                    try {
                        const locationDetails = await this.geographyService.getLocationDetails(stop.fkIdDistrict);

                        return {
                            ...stop,
                            location: locationDetails?.fullPath || 'Ubicación no disponible'
                            // TODO: si se requiere el nombre del conductor, obtenerlo del BC Driver.
                            // Ya no existe endpoint companies para enriquecer con nombre de empresa.
                        };
                    } catch (error) {
                        console.warn(`Error enriqueciendo datos del paradero ${stop.id}:`, error);
                        return {
                            ...stop,
                            location: 'Ubicación no disponible'
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
     * @param {int} driverId - ID del conductor
     * @returns {Promise<Array<{label: string, value: string}>>}
     */
    async getStopsForSelect(driverId) {
        try {
            if (!driverId) {
                throw new Error('ID de conductor inválido');
            }
            const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`);
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

            const driverId = this._getDriverIdFromLocalStorage();
            const current = await super.getById(id);

            const updatedData = {
                id: Number(current.id),
                name: updateData.name,
                googleMapsUrl: current.googleMapsUrl,
                imageUrl: current.imageUrl,
                fkIdDriver: Number(driverId),
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
                response.fkIdDriver,
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

            const driverId = this._getDriverIdFromLocalStorage();

            // Crear FormData para enviar archivos
            const formData = new FormData();

            // Agregar campos de texto
            formData.append('Name', stopData.name);
            formData.append('Address', stopData.address);
            formData.append('Reference', stopData.reference);
            formData.append('FkIdDriver', driverId.toString());
            formData.append('FkIdDistrict', stopData.fk_id_district);
            const lat = stopData.latitude ?? stopData.lat;
            const lng = stopData.longitude ?? stopData.lng;
            const gmaps = stopData.google_maps_url
                || (lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : '');
            formData.append('GoogleMapsUrl', gmaps);
            if (lat != null) formData.append('Latitude', String(lat));
            if (lng != null) formData.append('Longitude', String(lng));

            // Agregar archivo si existe
            if (stopData.imageFile) {
                formData.append('ImageFile', stopData.imageFile);
            }

            // Log para debugging
            console.log('Enviando datos del paradero:', {
                name: stopData.name,
                address: stopData.address,
                reference: stopData.reference,
                driverId: driverId,
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
                response.data.fkIdDriver,
                response.data.fkIdDistrict,
                response.data.address,
                response.data.reference,
            );
        } catch (error) {
            console.error('Error al crear paradero:', error);
            throw this._enhanceError(error);
        }
    }

    _validateStopData(data) {
        const requiredFields = {
            name: 'string',
            address: 'string',
            reference: 'string'
        };

        Object.entries(requiredFields).forEach(([field, type]) => {
            if (!data[field] || typeof data[field] !== type) {
                throw new Error(`Campo requerido: ${field} (debe ser ${type})`);
            }
        });
    }

    _getDriverIdFromLocalStorage() {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData || !userData.driverId) {
                throw new Error('No se encontró ID de conductor en el usuario autenticado');
            }
            return Number(userData.driverId);
        } catch (error) {
            console.error('Error al obtener driverId del localStorage:', error);
            throw new Error('No se pudo obtener el ID del conductor');
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
