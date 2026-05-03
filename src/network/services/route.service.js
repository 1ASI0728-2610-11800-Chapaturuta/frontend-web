import { RouteEntity } from '../models/route.entity.js';
import {BaseService} from "@/shared/services/base-service.js";
import {StopService} from "@/network/services/stop.service.js";
import axios from "axios";

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
            const response = await axios.post(`${this.resourcePath()}`, requestBody);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }


    async loadRoutesByCompanyId(companyId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/company/${companyId}`);
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

    async getGeometry(routeId) {
        try {
            const r = await this.http.get(`${this.resourcePath()}/${routeId}/geometry`);
            return decodeGeometry(r.data?.geometry ?? r.data);
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async previewRoute(stopIds) {
        try {
            const r = await this.http.post(`${this.resourcePath()}/preview`, { stopsIds: stopIds });
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