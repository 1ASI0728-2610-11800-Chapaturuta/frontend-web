// Alineado con CreateFullRouteResource del backend:
// { price, duration, frequency, stopsIds, schedules }
export class CreateRouteDto {
    constructor(price, duration, frequency, stopsIds = [], schedules = []) {
        this.price = price;
        this.duration = duration;
        this.frequency = frequency;
        this.stopsIds = stopsIds;
        this.schedules = schedules;
    }
}
