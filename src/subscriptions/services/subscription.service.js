import { BaseService } from '@/shared/services/base-service.js'

export class PlanService extends BaseService {
  constructor() {
    super('v1/plans')
  }

  async getPlansByTargetRole(role) {
    const response = await this.http.get(`${this.resourcePath()}/by-target-role/${role}`)
    return response.data
  }
}

export class SubscriptionService extends BaseService {
  constructor() {
    super('v1/subscriptions')
  }

  async getActiveByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/active/by-user/${userId}`)
    return response.data
  }

  async getHistoryByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/history/by-user/${userId}`)
    return response.data
  }

  async subscribeToPlan({ fkIdUser, fkIdPlan, autoRenew = true, paymentMethod = 3 }) {
    const response = await this.http.post(this.resourcePath(), {
      fkIdUser: Number(fkIdUser),
      fkIdPlan: Number(fkIdPlan),
      autoRenew,
      paymentMethod: Number(paymentMethod)
    })
    return response.data
  }

  async cancel(subscriptionId) {
    const response = await this.http.post(`${this.resourcePath()}/${subscriptionId}/cancel`)
    return response.data
  }

  async renew(subscriptionId) {
    const response = await this.http.post(`${this.resourcePath()}/${subscriptionId}/renew`)
    return response.data
  }
}
