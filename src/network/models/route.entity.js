// dominio/entities/Route.js
// Alineado con RouteAggregateResource del backend (camelCase):
// id, price, frequency, duration, isActive, status, distanceMeters, durationSeconds, geometry, stops, schedules
export class RouteEntity {
    constructor(
        id,
        duration,
        price,
        frequency,
        stops = [],
        schedules = [],
        {
            isActive = true,
            status = null,
            distanceMeters = null,
            durationSeconds = null,
            geometry = null
        } = {}
    ) {
        this.id = id;
        this.duration = duration;
        this.price = price;
        this.frequency = frequency;
        this.isActive = isActive;
        this.status = status;
        this.distanceMeters = distanceMeters;
        this.durationSeconds = durationSeconds;
        this.geometry = geometry;
        this.stops = stops;
        this.schedules = schedules;
    }
}
