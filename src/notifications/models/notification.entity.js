/**
 * Entidad Notification. Campos camelCase EXACTOS de NotificationResource
 * (Notifications/Interfaces/REST/Resources/NotificationResource.cs) +
 * Notifications/Domain/Model/Aggregates/Notification.cs.
 *
 * Forma del backend (NotificationResource):
 *   Id, FkIdUser, Title, Message, Type, IsRead, CreatedAt
 * ASP.NET Core serializa a JSON en camelCase por defecto, por lo que aqui
 * usamos camelCase para que coincida con la respuesta real:
 *   { id, fkIdUser, title, message, type, isRead, createdAt }
 */

/** Valores conocidos del campo Type (string del backend). */
export const NOTIFICATION_TYPE = {
  INFO: 'Info',
  WARNING: 'Warning',
  SUCCESS: 'Success',
  ERROR: 'Error'
}

export class Notification {
  constructor({
                id = null,
                fkIdUser = null,
                title = '',
                message = '',
                type = NOTIFICATION_TYPE.INFO,
                isRead = false,
                createdAt = null
              } = {}) {
    this.id = id
    this.fkIdUser = fkIdUser
    this.title = title
    this.message = message
    this.type = type
    this.isRead = isRead
    this.createdAt = createdAt
  }

  /** true si la notificacion aun no ha sido leida. */
  get isUnread() {
    return !this.isRead
  }
}
