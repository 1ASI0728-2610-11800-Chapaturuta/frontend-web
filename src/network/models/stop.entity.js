export class StopEntity {
    constructor(id, name, google_maps_url, image_url, phone, fk_id_company, fk_id_district, address, reference) {
        //opcional verificar errores
        if (!id || typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new Error('ID is required and must be a non-empty string');
        }
        if (!name || typeof name !== 'string') {
            throw new Error('Name is required and must be a non-empty string');
        }
        if (!fk_id_company || typeof fk_id_company !== 'number' || !Number.isInteger(fk_id_company)) {
            throw new Error('Company ID is required and must be a non-empty int');
        }
        if (!fk_id_district || typeof fk_id_district !== 'number' || !Number.isInteger(fk_id_district)) {
            throw new Error('fk_id_district ID is required and must be a non-empty int');
        }
        if (phone && typeof phone !== 'string') {
            throw new Error('Phone must be a string if provided');
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
        this.phone = phone;
        this.fk_id_company = fk_id_company;
        this.fk_id_district = fk_id_district;
        this.address = address;
        this.reference = reference;
    }
}