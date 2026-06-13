import { BaseService } from '@/shared/services/base-service.js'
import { getUserId } from '@/shared/services/session.service.js'

/**
 * Asistente IA de viajes multi-tramo (Pasajero Premium).
 * POST /discovery/assistant { userId, message } -> { reply, itineraries }
 */
export class AssistantService extends BaseService {
  constructor() { super('discovery') }

  async ask(message) {
    const userId = getUserId()
    const response = await this.http.post(`${this.resourcePath()}/assistant`, {
      userId: Number(userId || 0),
      message
    })
    return response.data
  }
}
