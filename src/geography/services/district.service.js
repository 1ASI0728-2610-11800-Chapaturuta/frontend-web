import { BaseService } from '@/shared/services/base-service.js';
import { District } from '../models/district.entity.js';

export class DistrictService extends BaseService {
    constructor() {
        super('geographic/districts');
    }

    //el get all se incluye gracias a la herencia de BaseService

    async getByProvince(provinceId) {
        const response = await this.http.get(`${this.resourcePath()}/province/${provinceId}`);
        return response.data.map(item => new District(item));
    }
}