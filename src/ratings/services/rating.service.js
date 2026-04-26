import { BaseService } from '@/shared/services/base-service.js'

// TODO: endpoint pendiente de implementación en backend
export class RatingService extends BaseService {
  constructor() {
    super('ratings')
  }

  async getRatingsByRouteId(routeId) {
    // TODO: endpoint pendiente de implementación en backend
    const response = await this.http.get(`${this.resourcePath()}/route/${routeId}`)
    return response.data
  }

  async createRating(data) {
    // TODO: endpoint pendiente de implementación en backend
    return this.create(data)
  }
}
