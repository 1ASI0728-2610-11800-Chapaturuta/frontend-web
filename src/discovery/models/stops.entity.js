export class Stop {
    constructor(id, name, googleMapsUrl, imageUrl, driverId, locationId) {
        this.id = id;
        this.name = name;
        this.googleMapsUrl = googleMapsUrl;
        this.imageUrl = imageUrl;
        // El backend asocia la parada al conductor (FkIdDriver) y eliminó Phone.
        this.driverId = driverId;
        this.locationId = locationId;
    }
}