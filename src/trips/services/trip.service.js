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

  async createTrip({ fkIdRoute, fkIdOriginStop, fkIdDestinationStop, price }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const response = await this.http.post(this.resourcePath(), {
      fkIdUser: user.id,
      fkIdDriver: null,
      fkIdRoute,
      fkIdOriginStop,
      fkIdDestinationStop,
      price
    })
    return response.data
  }
}
