import { BaseService } from '@/shared/services/base-service.js'

/**
 * Servicio de Colecciones.
 *
 * Conecta con CollectionsController (base `api/collections`). Nota: el endpoint base
 * se pasa SIN el prefijo `api/` porque VITE_API_BASE_URL ya termina en `/api/`
 * (mismo patrón que RouteService('routes'), RatingService('ratings'), etc.).
 *
 * Casing backend (camelCase en JSON):
 *  - CreateCollectionResource: { name, fkIdUser }
 *  - CollectionResource:       { id, name, fkIdUser, createdAt, itemCount }
 *  - CollectionItemResource:   { id, fkIdCollection, fkIdRoute, addedAt }
 */
export class CollectionService extends BaseService {
  constructor() {
    super('collections')
  }

  /**
   * Crea una colección.
   * @param {{ name: string, userId?: number|string, fkIdUser?: number|string }} payload
   * @returns {Promise<Object>} CollectionResource
   */
  async create({ name, userId, fkIdUser } = {}) {
    // El backend espera `fkIdUser`; aceptamos `userId` como alias amigable.
    return super.create({ name, fkIdUser: fkIdUser ?? userId })
  }

  /**
   * Lista las colecciones de un usuario.
   * GET collections/user/{userId}
   * @param {number|string} userId
   * @returns {Promise<Array>} Lista de CollectionResource
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
   * Renombra una colección.
   * PUT collections/{id}
   * @param {number|string} id
   * @param {{ name: string }} payload
   * @returns {Promise<Object>} CollectionResource
   */
  async update(id, { name } = {}) {
    return super.update(id, { name })
  }

  /**
   * Elimina una colección.
   * DELETE collections/{id}
   * @param {number|string} id
   * @returns {Promise}
   */
  async delete(id) {
    return super.delete(id)
  }

  /**
   * Agrega una ruta a una colección.
   * POST collections/{id}/routes/{routeId}
   * @param {number|string} id - ID de la colección
   * @param {number|string} routeId - ID de la ruta
   * @returns {Promise<Object>} CollectionItemResource
   */
  async addRoute(id, routeId) {
    try {
      const response = await this.http.post(`${this.resourcePath()}/${id}/routes/${routeId}`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  /**
   * Quita una ruta de una colección.
   * DELETE collections/{id}/routes/{routeId}
   * @param {number|string} id - ID de la colección
   * @param {number|string} routeId - ID de la ruta
   * @returns {Promise}
   */
  async removeRoute(id, routeId) {
    try {
      const response = await this.http.delete(`${this.resourcePath()}/${id}/routes/${routeId}`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  /**
   * Obtiene los items (rutas) de una colección.
   * GET collections/{id}/routes
   * @param {number|string} id - ID de la colección
   * @returns {Promise<Array>} Lista de CollectionItemResource
   */
  async getRoutes(id) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/${id}/routes`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }
}
