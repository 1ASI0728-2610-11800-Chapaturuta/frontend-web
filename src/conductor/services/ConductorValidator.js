/**
 * Validador del contexto Conductor (antes TransportCompanyValidator).
 * Valida los campos de un conductor segun el backend Driver.
 * Se quitaron las validaciones de empresa (RUC, logo, email-empresa).
 */
export class ConductorValidator {
    /** Categorias de licencia validas (LicenseCategory.cs). */
    static LICENSE_CATEGORIES = ['AIIa', 'AIIb', 'AIIIa', 'AIIIb', 'AIIIc'];

    /** Tipos de vehiculo validos (VehicleType.cs). */
    static VEHICLE_TYPES = ['Car', 'Pickup', 'Combi', 'Van', 'Bus', 'Minivan'];

    /** DNI peruano: 8 digitos numericos. */
    static validateDocumentNumber(documentNumber) {
        if (!documentNumber) return false;
        const cleaned = documentNumber.toString().replace(/\D/g, '');
        return cleaned.length === 8 && /^\d+$/.test(cleaned);
    }

    /** Telefono: entre 9 y 15 digitos. */
    static validatePhone(phone) {
        if (!phone) return false;
        const cleaned = phone.toString().replace(/\D/g, '');
        return cleaned.length >= 9 && cleaned.length <= 15;
    }

    /** Numero de licencia: requerido, no vacio. */
    static validateLicenseNumber(licenseNumber) {
        return !!licenseNumber?.toString().trim();
    }

    /** Categoria de licencia valida. */
    static validateLicenseCategory(category) {
        return this.LICENSE_CATEGORIES.includes(category);
    }

    /** Tipo de vehiculo valido. */
    static validateVehicleType(type) {
        return this.VEHICLE_TYPES.includes(type);
    }

    /** Anio del vehiculo: >= 1980 (regla del value object Vehicle). */
    static validateVehicleYear(year) {
        const y = Number(year);
        return Number.isInteger(y) && y >= 1980;
    }

    /** Capacidad del vehiculo: >= 1 (regla del value object Vehicle). */
    static validateVehicleCapacity(capacity) {
        const c = Number(capacity);
        return Number.isInteger(c) && c >= 1;
    }

    /** Placa del vehiculo: requerida, no vacia (regla del value object Vehicle). */
    static validatePlate(plate) {
        return !!plate?.toString().trim();
    }

    /**
     * Valida los datos de un conductor (incluido su vehiculo).
     * Acepta tanto la entidad con vehicle anidado como un objeto plano de formulario.
     * @param {Object} data - { firstName, lastName, documentNumber, phone,
     *                          licenseNumber, licenseCategory, vehicle:{...} }
     * @returns {string[]} lista de mensajes de error (vacia si todo es valido)
     */
    static validate(data) {
        const errors = [];

        // Nombres
        if (!data.firstName?.toString().trim()) {
            errors.push('Los nombres del conductor son requeridos');
        }
        if (!data.lastName?.toString().trim()) {
            errors.push('Los apellidos del conductor son requeridos');
        }

        // Documento (DNI)
        if (!data.documentNumber?.toString().trim()) {
            errors.push('El numero de documento (DNI) es requerido');
        } else if (!this.validateDocumentNumber(data.documentNumber)) {
            errors.push('El DNI debe tener exactamente 8 digitos numericos');
        }

        // Telefono
        if (!data.phone?.toString().trim()) {
            errors.push('El telefono es requerido');
        } else if (!this.validatePhone(data.phone)) {
            errors.push('El telefono debe tener entre 9 y 15 digitos');
        }

        // Licencia
        if (!this.validateLicenseNumber(data.licenseNumber)) {
            errors.push('El numero de licencia es requerido');
        }
        if (!this.validateLicenseCategory(data.licenseCategory)) {
            errors.push('La categoria de licencia es invalida (AIIa, AIIb, AIIIa, AIIIb, AIIIc)');
        }

        // Vehiculo
        const vehicle = data.vehicle ?? {};
        if (!this.validatePlate(vehicle.plate)) {
            errors.push('La placa del vehiculo es requerida');
        }
        if (!this.validateVehicleType(vehicle.type)) {
            errors.push('El tipo de vehiculo es invalido (Car, Pickup, Combi, Van, Bus, Minivan)');
        }
        if (!this.validateVehicleYear(vehicle.year)) {
            errors.push('El anio del vehiculo debe ser 1980 o posterior');
        }
        if (!this.validateVehicleCapacity(vehicle.capacity)) {
            errors.push('La capacidad del vehiculo debe ser al menos 1');
        }

        return errors;
    }
}
