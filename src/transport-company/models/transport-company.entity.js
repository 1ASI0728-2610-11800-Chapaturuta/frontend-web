export class TransportCompany {
    constructor({
                    id = null,
                    fk_id_manager=null,
                    name = null,
                    logo_url = null,
                    ruc = null,
                    phone = null,
                    email = null,
                    address = null,
                    description = null
                }) {
        this.id = id || this._generateId();
        this.fk_id_manager = fk_id_manager;
        this.name = name;
        this.logo_url = logo_url;
        this.ruc = ruc;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.description = description;
    }

    // Generación de ID mejorada
    _generateId() {
        return `tc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    // Actualizar logo con validación
    updateLogo(url) {
        if (!url) throw new Error("Logo URL cannot be empty");
        if (!url.match(/\.(jpeg|jpg|gif|png)$/i)) {
            throw new Error("Invalid image format");
        }

        this.logo_url = url;
    }
}