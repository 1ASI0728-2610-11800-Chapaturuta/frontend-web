export class Province {
    constructor({ id, name, regionId }) {
        if (!id || !name || !regionId) throw new Error('Datos incompletos');
        this.id = id;
        this.name = name;
        this.regionId = regionId;
    }

    toSelectOption() {
        return { code: this.id, name: this.name };
    }
}