import { BaseService } from '@/shared/services/base-service.js'

export class NotificationService extends BaseService {
  constructor() {
    super('notifications')
  }

  async getNotificationsByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  async markAsRead(notificationId) {
    const response = await this.http.put(`${this.resourcePath()}/${notificationId}/read`)
    return response.data
  }

  async deleteNotification(notificationId) {
    const response = await this.http.delete(`${this.resourcePath()}/${notificationId}`)
    return response.data
  }
}
