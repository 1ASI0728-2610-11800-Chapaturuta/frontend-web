export class StopEntity {
    constructor(id, name, google_maps_url, image_url, fkIdDriver, fkIdDistrict, address, reference) {
        //opcional verificar errores
        if (!id || typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new Error('ID is required and must be a non-empty string');
        }
        if (!name || typeof name !== 'string') {
            throw new Error('Name is required and must be a non-empty string');
        }
        if (!fkIdDriver || typeof fkIdDriver !== 'number' || !Number.isInteger(fkIdDriver)) {
            throw new Error('Driver ID is required and must be a non-empty int');
        }
        if (!fkIdDistrict || typeof fkIdDistrict !== 'number' || !Number.isInteger(fkIdDistrict)) {
            throw new Error('fkIdDistrict ID is required and must be a non-empty int');
        }
        if (!address || typeof address !== 'string') {
            throw new Error('Address is required and must be a non-empty string');
        }
        if (!reference || typeof reference !== 'string') {
            throw new Error('Reference is required and must be a non-empty string');
        }
        //*

        this.id = id;
        this.name = name;
        this.google_maps_url = google_maps_url ?? null;
        this.image_url = image_url ?? null;
        this.fkIdDriver = fkIdDriver;
        this.fkIdDistrict = fkIdDistrict;
        this.address = address;
        this.reference = reference;
    }
}
