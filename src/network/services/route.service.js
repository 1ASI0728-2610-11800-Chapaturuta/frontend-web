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
}