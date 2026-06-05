import { BaseService } from '@/shared/services/base-service.js'

export class PaymentService extends BaseService {
  constructor() {
    super('v1/payments')
  }

  async getPaymentsByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  async getPaymentById(paymentId) {
    const response = await this.http.get(`${this.resourcePath()}/${paymentId}`)
    return response.data
  }

  async confirmPayment(paymentId, externalReference = '') {
    const response = await this.http.post(`${this.resourcePath()}/${paymentId}/confirm`, { externalReference })
    return response.data
  }
}
