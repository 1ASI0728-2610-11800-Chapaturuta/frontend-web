import { BaseService } from '@/shared/services/base-service.js'

export class DiscoveryNearbyService extends BaseService {
  constructor() { super('discovery') }

  async nearby({ lat, lng, radius = 1500, useRoadDistance = false }) {
    const url = `${this.resourcePath()}/nearby?lat=${lat}&lng=${lng}&radius=${radius}&useRoadDistance=${useRoadDistance}`
    const r = await this.http.get(url)
    return r.data
  }
}
