import { BaseService } from '@/shared/services/base-service.js'

export class ReservationService extends BaseService {
  constructor() {
    super('v1/reservations')
  }

  async createReservation({ fkIdUser, fkIdTrip, documentType = 'Dni', documentNumber, seats = 1, paymentMethod = 'Card' }) {
    const response = await this.http.post(this.resourcePath(), {
      fkIdUser: Number(fkIdUser),
      fkIdTrip: Number(fkIdTrip),
      documentType,
      documentNumber,
      seats: Number(seats),
      paymentMethod
    })
    return response.data
  }

  async confirm(reservationId) {
    const response = await this.http.post(`${this.resourcePath()}/${reservationId}/confirm`)
    return response.data
  }

  async cancel(reservationId) {
    const response = await this.http.post(`${this.resourcePath()}/${reservationId}/cancel`)
    return response.data
  }

  async getByUser(userId) {
    const response = await this.http.get(`${this.resourcePath()}/by-user/${userId}`)
    return response.data
  }

  async getByTrip(tripId) {
    const response = await this.http.get(`${this.resourcePath()}/by-trip/${tripId}`)
    return response.data
  }

  async getByDriver(driverId) {
    const response = await this.http.get(`${this.resourcePath()}/by-driver/${driverId}`)
    return response.data
  }
}
