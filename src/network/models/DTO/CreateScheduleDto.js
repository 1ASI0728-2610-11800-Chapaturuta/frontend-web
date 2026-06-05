// Alineado con CreateScheduleResource del backend:
// { dayOfWeek, startTime, endTime, enabled }
// La ruta se crea junto con los horarios (CreateFullRoute), por eso no se envía routeId.
export class CreateScheduleDto {
    constructor(dayOfWeek,
                startTime,
                endTime,
                enabled = true) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.enabled = enabled;
    }
}
