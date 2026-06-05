export class Province {
    constructor({ id, name, fkIdRegion }) {
        if (!id || !name || !fkIdRegion) throw new Error('Datos incompletos');
        this.id = id;
        this.name = name;
        // El backend (ProvinceResource) serializa la clave foránea como camelCase fkIdRegion
        this.fkIdRegion = fkIdRegion;
    }

    toSelectOption() {
        return { code: this.id, name: this.name };
    }
}