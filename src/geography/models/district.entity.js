export class District {
    constructor({ id, name, fkIdProvince }) {
        if (!id || !name || !fkIdProvince) throw new Error('Datos incompletos');
        this.id = id;
        this.name = name;
        // El backend (DistrictResource) serializa la clave foránea como camelCase fkIdProvince
        this.fkIdProvince = fkIdProvince;
    }

    toSelectOption() {
        return { code: this.id, name: this.name };
    }
}