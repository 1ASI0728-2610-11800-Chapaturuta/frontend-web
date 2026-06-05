// Asociación ruta-parada. El backend (CreateFullRoute) recibe StopsIds: List<int>,
// pero este DTO se mantiene para representar el vínculo ruta/parada de forma explícita.
export class CreateRouteStopsDto {
    constructor(fkIdRoute, fkIdStop) {
        this.fkIdStop = fkIdStop;
        this.fkIdRoute = fkIdRoute;
    }
}
