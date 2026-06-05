/**
 * Entidad Rating. Campos camelCase EXACTOS de RatingResource
 * (Ratings/Interfaces/REST/Resources/RatingResource.cs):
 *   record RatingResource(int Id, int FkIdUser, int FkIdDriver, int FkIdTrip,
 *                         int Score, string? Comment, DateTime CreatedAt)
 * Las calificaciones son POR CONDUCTOR (fkIdDriver) y referencian un viaje (fkIdTrip).
 */
export class Rating {
  constructor({
                id = null,
                fkIdUser = null,
                fkIdDriver = null,
                fkIdTrip = null,
                score = 0,
                comment = '',
                createdAt = null
              } = {}) {
    this.id = id
    this.fkIdUser = fkIdUser
    this.fkIdDriver = fkIdDriver
    this.fkIdTrip = fkIdTrip
    this.score = score
    this.comment = comment
    this.createdAt = createdAt
  }
}
