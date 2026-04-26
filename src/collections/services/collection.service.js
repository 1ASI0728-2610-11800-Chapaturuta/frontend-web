import { BaseService } from '@/shared/services/base-service.js'

// TODO: endpoint pendiente de implementación en backend
export class CollectionService extends BaseService {
  constructor() {
    super('collections')
  }

  async getCollectionsByUserId(userId) {
    // TODO: endpoint pendiente de implementación en backend
    const response = await this.http.get(`${this.resourcePath()}/user/${userId}`)
    return response.data
  }

  async addRouteToCollection(collectionId, routeId) {
    // TODO: endpoint pendiente de implementación en backend
    const response = await this.http.post(`${this.resourcePath()}/${collectionId}/routes/${routeId}`)
    return response.data
  }
}
