/**
 * Entidad Trip (Viaje). Campos camelCase EXACTOS de TripResource
 * (Trips/Interfaces/REST/Resources/TripResource.cs) +
 * Trips/Domain/Model/Aggregates/Trip.cs.
 *
 * Forma del backend (TripResource):
 *   Id, FkIdUser, FkIdDriver?, FkIdRoute, FkIdOriginStop,
 *   FkIdDestinationStop, StartTime, EndTime?, Price?, Status, AvailableSeats
 * ASP.NET Core serializa a JSON en camelCase por defecto, por lo que aqui
 * usamos camelCase para que coincida con la respuesta real.
 */

/** Valores conocidos del campo Status (string del backend). */
export const TRIP_STATUS = {
    PENDING: 'Pending',
    IN_PROGRESS: 'InProgress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
}

export class Trip {
    constructor({
                    id = null,
                    fkIdUser = null,
                    fkIdDriver = null,
                    fkIdRoute = null,
                    fkIdOriginStop = null,
                    fkIdDestinationStop = null,
                    startTime = null,
                    endTime = null,
                    price = null,
                    status = TRIP_STATUS.PENDING,
                    availableSeats = 0
                } = {}) {
        this.id = id;
        this.fkIdUser = fkIdUser;
        this.fkIdDriver = fkIdDriver;
        this.fkIdRoute = fkIdRoute;
        this.fkIdOriginStop = fkIdOriginStop;
        this.fkIdDestinationStop = fkIdDestinationStop;
        this.startTime = startTime;
        this.endTime = endTime;
        this.price = price;
        this.status = status;
        this.availableSeats = availableSeats;
    }

    /** true si el viaje aun no ha finalizado. */
    get isActive() {
        return this.status === TRIP_STATUS.PENDING || this.status === TRIP_STATUS.IN_PROGRESS;
    }
}
