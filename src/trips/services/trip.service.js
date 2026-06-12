import { BaseService } from '@/shared/services/base-service.js'

export class TripService extends BaseService {
  constructor() {
    super('trips')
  }

  async getTripsByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  // Enriched history (resolved names) for the passenger — backing TripsHistoryPage.
  async getTripHistoryByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}/history`)
    return response.data
  }

  // Enriched history (resolved names) for the driver.
  async getTripHistoryByDriverId(driverId) {
    const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}/history`)
    return response.data
  }

  async createTrip({ fkIdRoute, fkIdOriginStop, fkIdDestinationStop, price, availableSeats = 1 }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const response = await this.http.post(this.resourcePath(), {
      fkIdUser: user.id,
      fkIdDriver: null,
      fkIdRoute,
      fkIdOriginStop,
      fkIdDestinationStop,
      price,
      availableSeats
    })
    return response.data
  }

  async startTrip(id) {
    const response = await this.http.post(`${this.resourcePath()}/${id}/start`)
    return response.data
  }

  async completeTrip(id) {
    const response = await this.http.post(`${this.resourcePath()}/${id}/complete`)
    return response.data
  }

  async cancelTrip(id) {
    const response = await this.http.post(`${this.resourcePath()}/${id}/cancel`)
    return response.data
  }
}
