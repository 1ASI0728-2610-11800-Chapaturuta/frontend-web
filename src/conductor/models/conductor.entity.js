/**
 * Forma exacta del value object Vehicle del backend
 * (Driver/Domain/Model/ValueObjects/Vehicle.cs).
 * El backend lo serializa APLANADO dentro de DriverResource como
 * VehiclePlate / VehicleBrand / VehicleModel / VehicleYear / VehicleCapacity / VehicleType.
 * Aqui lo modelamos como objeto anidado para que coincida con el value object.
 */
export class Vehicle {
    constructor({
                    plate = '',
                    brand = '',
                    model = '',
                    year = 1980,
                    capacity = 1,
                    type = 'Car' // VehicleType: Car | Pickup | Combi | Van | Bus | Minivan
                } = {}) {
        this.plate = plate;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.capacity = capacity;
        this.type = type;
    }
}

/**
 * Entidad Conductor. Campos camelCase EXACTOS de DriverResource
 * (Driver/Interfaces/REST/Resources/DriverResource.cs) +
 * Driver/Domain/Model/Aggregates/Driver.cs.
 */
export class Conductor {
    constructor({
                    id = null,
                    fkIdUser = null,
                    firstName = '',
                    lastName = '',
                    documentNumber = '',
                    phone = '',
                    photoUrl = '',
                    licenseNumber = '',
                    licenseCategory = 'AIIa', // LicenseCategory: AIIa | AIIb | AIIIa | AIIIb | AIIIc
                    vehicle = {},
                    isAvailable = true,
                    createdAt = null,
                    updatedAt = null
                } = {}) {
        this.id = id;
        this.fkIdUser = fkIdUser;
        this.firstName = firstName;
        this.lastName = lastName;
        this.documentNumber = documentNumber;
        this.phone = phone;
        this.photoUrl = photoUrl;
        this.licenseNumber = licenseNumber;
        this.licenseCategory = licenseCategory;
        this.vehicle = vehicle instanceof Vehicle ? vehicle : new Vehicle(vehicle);
        this.isAvailable = isAvailable;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /** Nombre completo del conductor. */
    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }
}
