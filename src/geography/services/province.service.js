import { BaseService } from '@/shared/services/base-service.js';
import { Province } from '../models/province.entity.js';

export class ProvinceService extends BaseService {
    constructor() {
        super('geographic/provinces');
    }

    async getByRegion(regionId) {
        const response = await this.http.get(`${this.resourcePath()}/region/${regionId}`);
        return response.data.map(item => new Province(item));
    }
}