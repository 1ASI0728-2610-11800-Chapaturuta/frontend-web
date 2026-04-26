// dominio/entities/Route.js
export class RouteEntity {
    constructor(id, duration, price, frequency, stopsIds = [], schedules = []) {
        this.id = id;
        this.duration = duration;
        this.price = price;
        this.frequency = frequency;
        this.stopsIds = stopsIds;
        this.schedules = schedules;
    }
}
