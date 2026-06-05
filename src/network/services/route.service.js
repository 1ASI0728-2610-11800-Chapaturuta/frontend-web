import { RouteEntity } from '../models/route.entity.js';
import {BaseService} from "@/shared/services/base-service.js";
import {StopService} from "@/network/services/stop.service.js";

export class RouteService extends BaseService{
    constructor() {
        super('routes');
        this.stopsService = new StopService();
    }

    async createFullRoute(routeInfo, scheduleData) {
        try {
            const daysOfWeek = [
                'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
            ];
            const schedules = daysOfWeek
                .filter(day => scheduleData[day]) // Solo los días que existan en el objeto
                .map(day => ({
                    dayOfWeek: day,
                    startTime: scheduleData[day].startTime,
                    endTime: scheduleData[day].endTime,
                    enabled: scheduleData[day].enabled
                }));
            const requestBody = {
                frequency: routeInfo.frequency,
                price: routeInfo.price,
                duration: routeInfo.duration,
                stopsIds: [
                    routeInfo.selectedFirstStop,
                    routeInfo.selectedSecondStop
                ],
                schedules
            };
            // Usar this.http (instancia con interceptor de auth) para enviar el Bearer token.
            const response = await this.http.post(`${this.resourcePath()}`, requestBody);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }


    /**
     * Obtiene las rutas asociadas a un conductor.
     * @param {int} driverId - ID del conductor
     * @returns {Promise<Array>} Lista de rutas
     */
    async getRoutesByDriverId(driverId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`);
            return response.data;
        }catch (error) {
            console.log(error)
            throw this._enhanceError(error);
        }
    }

    async getByRouteId(routeId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/${routeId}`);
            return response.data;
        }catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Alterna la disponibilidad (isActive) de una ruta.
     * PATCH routes/{id}/toggle-availability
     * @param {int} id - ID de la ruta
     * @returns {Promise} La ruta actualizada
     */
    async toggleAvailability(id) {
        return this.patch(id, {}, 'toggle-availability');
    }

    /**
     * Calcula el ETA desde una posición (lat, lng) hasta el destino de la ruta.
     * GET routes/{id}/eta?lat=&lng=
     * @param {int} id - ID de la ruta
     * @param {number} lat - Latitud de la posición actual
     * @param {number} lng - Longitud de la posición actual
     * @returns {Promise} { routeId, etaSeconds, etaMinutes }
     */
    async getEta(id, lat, lng) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/${id}/eta`, {
                params: { lat, lng }
            });
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Obtiene las rutas asociadas a un distrito.
     * GET routes/district/{districtId}
     * @param {int} districtId - ID del distrito
     * @returns {Promise<Array>} Lista de rutas
     */
    async getByDistrict(districtId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/district/${districtId}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async getGeometry(routeId) {
        try {
            const r = await this.http.get(`${this.resourcePath()}/${routeId}/geometry`);
            return decodeGeometry(r.data?.geometry ?? r.data);
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async previewRoute(coordinates) {
        try {
            // El backend (POST routes/preview) espera { coordinates: [{ latitude, longitude }] }
            const r = await this.http.post(`${this.resourcePath()}/preview`, { coordinates });
            return {
                distanceMeters: r.data.distanceMeters,
                durationSeconds: r.data.durationSeconds,
                latLngs: decodeGeometry(r.data.geometry)
            };
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}

// Accepts GeoJSON LineString, array of [lng,lat] / [lat,lng], or polyline-encoded string.
function decodeGeometry(geom) {
    if (!geom) return [];
    if (Array.isArray(geom)) {
        return geom.map(p => Array.isArray(p) ? [p[1] ?? p[0], p[0] ?? p[1]] : [p.lat, p.lng]);
    }
    if (typeof geom === 'object' && geom.coordinates) {
        // GeoJSON: [lng,lat]
        return geom.coordinates.map(([lng, lat]) => [lat, lng]);
    }
    if (typeof geom === 'string') {
        return decodePolyline(geom);
    }
    return [];
}

// Google polyline algorithm (precision 5)
function decodePolyline(str, precision = 5) {
    let index = 0, lat = 0, lng = 0, coordinates = [];
    const factor = Math.pow(10, precision);
    while (index < str.length) {
        let result = 1, shift = 0, b;
        do { b = str.charCodeAt(index++) - 63 - 1; result += b << shift; shift += 5; } while (b >= 0x1f);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);
        result = 1; shift = 0;
        do { b = str.charCodeAt(index++) - 63 - 1; result += b << shift; shift += 5; } while (b >= 0x1f);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
}
