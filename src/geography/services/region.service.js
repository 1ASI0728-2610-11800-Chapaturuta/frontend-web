import { BaseService } from '@/shared/services/base-service.js';
import { Region } from '../models/region.entity.js';

export class RegionService extends BaseService {
    constructor() {
        super('geographic/regions');
    }
}