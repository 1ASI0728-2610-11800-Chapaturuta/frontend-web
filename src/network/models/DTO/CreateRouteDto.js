export class CreateRouteDto {
    constructor(duracion, tarifa, frecuencia) {
        this.duracion   = duracion;
        this.tarifa     = tarifa;
        this.frecuencia = frecuencia;
    }
}