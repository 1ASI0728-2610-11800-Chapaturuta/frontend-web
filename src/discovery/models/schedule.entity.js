export class ScheduleEntity {
    constructor(id, day, timeFrom, timeTo, isAvailable, stopId) {
        this.id = id;
        this.day = day;
        this.timeFrom = timeFrom;
        this.timeTo = timeTo;
        this.isAvailable = isAvailable;
        this.stopId = stopId;
    }
}