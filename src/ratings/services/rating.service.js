import { BaseService } from '@/shared/services/base-service.js'

export class RatingService extends BaseService {
  constructor() {
    super('ratings')
  }

  async getByDriver(driverId) {
    const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`)
    return response.data
  }

  async getDriverSummary(driverId) {
    const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}/summary`)
    return response.data
  }

  async getByUser(userId) {
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  async createRating(data) {
    return this.create(data)
  }
}
