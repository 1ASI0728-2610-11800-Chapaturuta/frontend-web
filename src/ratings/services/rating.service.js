import { BaseService } from '@/shared/services/base-service.js'

/**
 * Servicio del contexto Ratings.
 * El backend refactorizó las calificaciones: ahora son POR CONDUCTOR (no por ruta).
 * Endpoints reales en /api/ratings (RatingsController.cs).
 * Extiende BaseService, que ya provee create/getAll/getById/update/patch/delete.
 */
export class RatingService extends BaseService {
  constructor() {
    // VITE_API_BASE_URL ya termina en /api/, por eso es 'ratings' (no 'api/ratings')
    super('ratings')
  }

  /**
   * Crea una calificación.
   * POST api/ratings (CreateRatingResource) — rol Traveller/Admin.
   * @param {Object} resource
   * @param {number} resource.fkIdUser   - ID del usuario que califica
   * @param {number} resource.fkIdDriver - ID del conductor calificado
   * @param {number} resource.fkIdTrip   - ID del viaje completado
   * @param {number} resource.score      - Puntaje de 1 a 5
   * @param {string} [resource.comment]  - Reseña opcional
   * @returns {Promise<Object>} RatingResource creado
   */
  async createRating({ fkIdUser, fkIdDriver, fkIdTrip, score, comment }) {
    return this.create({ fkIdUser, fkIdDriver, fkIdTrip, score, comment })
  }

  /**
   * Lista las calificaciones de un conductor.
   * GET api/ratings/driver/{driverId}
   * @param {number|string} driverId
   * @returns {Promise<Array>} lista de RatingResource
   */
  async getRatingsByDriverId(driverId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  /**
   * Obtiene el resumen de calificaciones de un conductor (promedio + total).
   * GET api/ratings/driver/{driverId}/summary
   * @param {number|string} driverId
   * @returns {Promise<Object>} RatingSummaryResource ({ driverId, average, count })
   */
  async getDriverSummary(driverId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}/summary`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  /**
   * Lista las calificaciones emitidas por un usuario.
   * GET api/ratings/user/{userId}
   * @param {number|string} userId
   * @returns {Promise<Array>} lista de RatingResource
   */
  async getRatingsByUser(userId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }
}
