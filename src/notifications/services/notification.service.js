import { BaseService } from '@/shared/services/base-service.js'

/**
 * Servicio del contexto Notifications.
 * Endpoints reales en api/notifications (NotificationsController.cs:
 * [Route("api/[controller]")] -> api/notifications).
 * Extiende BaseService, que construye la URL como serverBaseUrl + resourceEndpoint.
 *
 * Forma del backend (NotificationResource): camelCase por defecto de ASP.NET Core
 *   { id, fkIdUser, title, message, type, isRead, createdAt }
 */
export class NotificationService extends BaseService {
  constructor() {
    // VITE_API_BASE_URL ya termina en /api/, por eso es 'notifications' (no 'api/notifications')
    super('notifications')
  }

  /**
   * Lista las notificaciones de un usuario.
   * GET api/notifications/user/{userId}
   * @param {number|string} userId - id del usuario IAM
   * @returns {Promise<Array>} lista de NotificationResource
   */
  async getByUser(userId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  /**
   * Marca una notificacion como leida.
   * PUT api/notifications/{id}/read  (el backend usa PUT, no PATCH)
   * @param {number|string} id - id de la notificacion
   * @returns {Promise<Object>} NotificationResource actualizado
   */
  async markAsRead(id) {
    try {
      const response = await this.http.put(`${this.resourcePath()}/${id}/read`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  /**
   * Elimina una notificacion.
   * DELETE api/notifications/{id}
   * @param {number|string} id - id de la notificacion
   * @returns {Promise<void>}
   */
  async delete(id) {
    return super.delete(id)
  }
}
