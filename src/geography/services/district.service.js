import { BaseService } from '@/shared/services/base-service.js';
import { District } from '../models/district.entity.js';

export class DistrictService extends BaseService {
    constructor() {
        super('geographic/districts');
    }

    //el get all se incluye gracias a la herencia de BaseService

    async getByProvince(provinceId) {
        const data = await this.http.get(`${this.resourcePath()}?fk_id_province=${provinceId}`);
        return data.map(item => new District(item));
    }
}