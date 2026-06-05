// dominio/entities/Collection.js
// Alineado con CollectionResource del backend (camelCase):
//   id, name, fkIdUser, createdAt, itemCount
// y CollectionItemResource:
//   id, fkIdCollection, fkIdRoute, addedAt

export class Collection {
  /**
   * @param {Object} data
   * @param {number}  data.id
   * @param {string}  data.name
   * @param {number}  data.fkIdUser   - ID del usuario dueño (alias: userId)
   * @param {string}  data.createdAt  - ISO date
   * @param {number}  data.itemCount  - cantidad de rutas guardadas
   * @param {Array}   data.items      - items de la colección (CollectionItem[])
   */
  constructor({
    id = null,
    name = '',
    fkIdUser = null,
    userId = null,
    createdAt = null,
    itemCount = 0,
    items = [],
  } = {}) {
    this.id = id
    this.name = name
    this.fkIdUser = fkIdUser ?? userId
    this.userId = this.fkIdUser // alias amigable
    this.createdAt = createdAt
    this.itemCount = itemCount
    this.items = items
  }

  /** Crea una Collection a partir de un CollectionResource del backend. */
  static fromResource(resource = {}) {
    return new Collection(resource)
  }
}

export class CollectionItem {
  /**
   * @param {Object} data
   * @param {number}  data.id
   * @param {number}  data.fkIdCollection
   * @param {number}  data.fkIdRoute
   * @param {string}  data.addedAt - ISO date
   */
  constructor({
    id = null,
    fkIdCollection = null,
    fkIdRoute = null,
    addedAt = null,
  } = {}) {
    this.id = id
    this.fkIdCollection = fkIdCollection
    this.fkIdRoute = fkIdRoute
    this.addedAt = addedAt
  }

  /** Crea un CollectionItem a partir de un CollectionItemResource del backend. */
  static fromResource(resource = {}) {
    return new CollectionItem(resource)
  }
}
