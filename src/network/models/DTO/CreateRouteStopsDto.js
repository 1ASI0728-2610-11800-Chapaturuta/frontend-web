export class CreateRouteStopsDto {
    constructor(fk_id_route,fk_id_stop ) {
        this.fk_id_stop = fk_id_stop;
        this.fk_id_route = fk_id_route;
    }
}