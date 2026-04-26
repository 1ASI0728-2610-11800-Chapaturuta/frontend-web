import { BaseService } from '@/shared/services/base-service.js';
import { Province } from '../models/province.entity.js';

export class ProvinceService extends BaseService {
    constructor() {
        super('geographic/provinces');
    }

    async getByRegion(regionId) {
        const data = await this.http.get(`${this.resourcePath()}?fk_id_region=${regionId}`);
        return data.map(item => new Province(item));
    }
}