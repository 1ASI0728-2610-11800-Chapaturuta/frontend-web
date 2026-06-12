import { BaseService } from '@/shared/services/base-service.js'

export class CollectionService extends BaseService {
  constructor() {
    super('collections')
  }

  async getCollectionsByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  async getCollectionRoutes(collectionId) {
    const response = await this.http.get(`${this.resourcePath()}/${collectionId}/routes`)
    return response.data
  }

  async createCollection(collection) {
    const response = await this.http.post(this.resourcePath(), collection)
    return response.data
  }

  async addRouteToCollection(collectionId, routeId) {
    const response = await this.http.post(`${this.resourcePath()}/${collectionId}/routes/${routeId}`)
    return response.data
  }

  async removeRouteFromCollection(collectionId, routeId) {
    const response = await this.http.delete(`${this.resourcePath()}/${collectionId}/routes/${routeId}`)
    return response.data
  }
}
