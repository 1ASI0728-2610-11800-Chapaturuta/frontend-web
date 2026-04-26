import { BaseService } from '@/shared/services/base-service.js'

// TODO: endpoint pendiente de implementación en backend
export class NotificationService extends BaseService {
  constructor() {
    super('notifications')
  }

  async getNotificationsByUserId(userId) {
    // TODO: endpoint pendiente de implementación en backend
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  async markAsRead(notificationId) {
    // TODO: endpoint pendiente de implementación en backend
    const response = await this.http.patch(`${this.resourcePath()}/${notificationId}/read`)
    return response.data
  }
}
