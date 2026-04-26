// dominio/entities/Schedule.js
export class ScheduleEntity {
    constructor(
        id,
        routeId,           // <-- nueva clave foránea
        dayOfWeek,
        startTime,
        endTime,
        enabled = true
    ) {
        this.id = id;
        this.routeId = routeId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.enabled = enabled;
    }
}
