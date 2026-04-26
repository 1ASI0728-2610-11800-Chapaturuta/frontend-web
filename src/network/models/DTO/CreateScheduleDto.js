export class CreateScheduleDto {
    constructor(routeId,           // <-- nueva clave foránea
                dayOfWeek,
                startTime,
                endTime,
                enabled = true) {
        this.routeId = routeId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.enabled = enabled;
    }
}