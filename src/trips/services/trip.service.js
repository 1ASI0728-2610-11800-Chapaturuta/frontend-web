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

  async createTrip({ fkIdRoute, fkIdOriginStop, fkIdDestinationStop, price, availableSeats = 1, startTime }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const response = await this.http.post(this.resourcePath(), {
      fkIdUser: user.id,
      fkIdDriver: null,
      fkIdRoute,
      fkIdOriginStop,
      fkIdDestinationStop,
      price,
      availableSeats,
      startTime
    })
    return response.data
  }

  // Driver publishes a shared trip for a route with N seats of capacity.
  async publishTrip({ fkIdRoute, fkIdOriginStop, fkIdDestinationStop, price, seats, fkIdDriver, startTime }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const response = await this.http.post(`${this.resourcePath()}/publish`, {
      fkIdUser: user.id,
      fkIdDriver,
      fkIdRoute,
      fkIdOriginStop,
      fkIdDestinationStop,
      price,
      seats: Number(seats),
      startTime
    })
    return response.data
  }

  // Published trips a passenger can still board (pending + free seats). routeId narrows to one route.
  async getJoinableTrips(routeId = null) {
    const url = routeId != null
      ? `${this.resourcePath()}/joinable?routeId=${routeId}`
      : `${this.resourcePath()}/joinable`
    const response = await this.http.get(url)
    return response.data
  }

  // Pending trips with no driver assigned — the pool a driver can claim.
  async getAvailableTrips() {
    const response = await this.http.get(`${this.resourcePath()}/available`)
    return response.data
  }

  // Driver claims a trip (sets its driver) so it appears in his history and can be started.
  async assignDriver(id, driverId) {
    const response = await this.http.post(`${this.resourcePath()}/${id}/assign-driver`, { driverId })
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
