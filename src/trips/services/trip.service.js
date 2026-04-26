import { BaseService } from '@/shared/services/base-service.js'

// TODO: endpoint pendiente de implementación en backend
export class TripService extends BaseService {
  constructor() {
    super('trips')
  }

  async getTripsByUserId(userId) {
    // TODO: endpoint pendiente de implementación en backend
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }
}
