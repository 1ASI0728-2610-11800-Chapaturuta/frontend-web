export class District {
    constructor({ id, name, provinceId }) {
        if (!id || !name || !provinceId) throw new Error('Datos incompletos');
        this.id = id;
        this.name = name;
        this.provinceId = provinceId;
    }

    toSelectOption() {
        return { code: this.id, name: this.name };
    }
}