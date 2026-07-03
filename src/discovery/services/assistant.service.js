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
    // El asistente llama a un LLM (OpenRouter) + OSRM por tramo: puede tardar
    // decenas de segundos. El timeout por defecto de BaseService (5s) es muy corto
    // y aborta la petición. Subimos el timeout solo para esta request.
    const response = await this.http.post(`${this.resourcePath()}/assistant`, {
      userId: Number(userId || 0),
      message
    }, { timeout: 90000 })
    return response.data
  }
}
