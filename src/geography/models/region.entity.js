export class Region {
    constructor({ id, name }) {
        if (!id || !name) throw new Error('ID y name son requeridos');
        this.id = id;
        this.name = name;
    }

    toSelectOption() {
        return { code: this.id, name: this.name };
    }
}