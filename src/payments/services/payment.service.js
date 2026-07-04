import { BaseService } from '@/shared/services/base-service.js'

export class PaymentService extends BaseService {
  constructor() {
    super('v1/payments')
  }

  async getPaymentsByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  async getPaymentsByDriverId(driverId) {
    const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`)
    return response.data
  }

  async getPaymentById(paymentId) {
    const response = await this.http.get(`${this.resourcePath()}/${paymentId}`)
    return response.data
  }

  async createPayment({ fkIdUser, amount, method, referenceType, referenceId, currency = 'PEN' }) {
    const response = await this.http.post(this.resourcePath(), {
      fkIdUser, amount, currency, method, referenceType, referenceId
    })
    return response.data
  }

  // PayU sandbox + the synchronous payment-confirmation flow can take several seconds,
  // well beyond the 5s default. Use a wider per-request timeout so the gateway round-trip
  // isn't aborted client-side as a false "timeout".
  async chargePayU(paymentId, payload) {
    const response = await this.http.post(
      `${this.resourcePath()}/payu/${paymentId}/charge`, payload, { timeout: 30000 })
    return response.data
  }

  async confirmPayment(paymentId, externalReference = '') {
    const response = await this.http.post(
      `${this.resourcePath()}/${paymentId}/confirm`, { externalReference }, { timeout: 30000 })
    return response.data
  }

  async failPayment(paymentId) {
    const response = await this.http.post(`${this.resourcePath()}/${paymentId}/fail`)
    return response.data
  }

  async createRefund(paymentId, { amount, reason }) {
    const response = await this.http.post(`${this.resourcePath()}/${paymentId}/refunds`, {
      amount: Number(amount),
      reason
    })
    return response.data
  }

  async getRefunds(paymentId) {
    const response = await this.http.get(`${this.resourcePath()}/${paymentId}/refunds`)
    return response.data
  }
}

export class RefundService extends BaseService {
  constructor() {
    super('v1/refunds')
  }

  async confirm(refundId) {
    const response = await this.http.post(`${this.resourcePath()}/${refundId}/confirm`)
    return response.data
  }
}
