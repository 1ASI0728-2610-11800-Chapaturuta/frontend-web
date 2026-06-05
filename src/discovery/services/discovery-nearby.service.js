import { BaseService } from '@/shared/services/base-service.js'
import { getUserId } from '@/shared/services/session.service.js'

export class DiscoveryNearbyService extends BaseService {
  constructor() { super('discovery') }

  async nearby({ lat, lng, radius = 1500, useRoadDistance = false }) {
    const userId = getUserId()
    const params = new URLSearchParams({
      userId: String(userId || 0),
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
      useRoadDistance: String(useRoadDistance)
    })
    const url = `${this.resourcePath()}/nearby?${params.toString()}`
    const r = await this.http.get(url)
    return r.data
  }
}
