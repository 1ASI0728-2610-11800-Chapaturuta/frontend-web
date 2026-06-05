import { Conductor, Vehicle } from '../models/conductor.entity.js';

/**
 * Assembler del contexto Conductor.
 *
 * El backend devuelve camelCase (DriverResource) con el vehiculo APLANADO:
 *   vehiclePlate, vehicleBrand, vehicleModel, vehicleYear, vehicleCapacity, vehicleType.
 * Aqui hacemos:
 *   - fromResponseToEntity: aplanado del API -> entidad con vehicle anidado.
 *   - fromEntityToResource: entidad -> CreateDriverResource aplanado para POST.
 *   - fromEntityToUpdateDriver / fromEntityToUpdateVehicle: payloads PATCH.
 *
 * NOTA: el mapeo es identidad camelCase. Se eliminaron los mapeos snake_case
 * viejos (fk_id_manager, logo_url, etc.) del antiguo TransportCompany.
 */
export class ConductorAssembler {
    /**
     * El backend NO usa convertidor string→enum: los enums viajan como ENTEROS
     * (su índice de declaración). Estas tablas mapean string↔int en ambos sentidos.
     * LicenseCategory.cs: AIIa=0, AIIb=1, AIIIa=2, AIIIb=3, AIIIc=4
     * VehicleType.cs:     Car=0, Pickup=1, Combi=2, Van=3, Bus=4, Minivan=5
     */
    static LICENSE_CATEGORIES = ['AIIa', 'AIIb', 'AIIIa', 'AIIIb', 'AIIIc'];
    static VEHICLE_TYPES = ['Car', 'Pickup', 'Combi', 'Van', 'Bus', 'Minivan'];

    static _licenseToInt(c) {
        const i = this.LICENSE_CATEGORIES.indexOf(c);
        return i >= 0 ? i : 0;
    }
    static _licenseToStr(v) {
        return typeof v === 'number' ? (this.LICENSE_CATEGORIES[v] ?? 'AIIa') : (v ?? 'AIIa');
    }
    static _vehicleTypeToInt(t) {
        const i = this.VEHICLE_TYPES.indexOf(t);
        return i >= 0 ? i : 0;
    }
    static _vehicleTypeToStr(v) {
        return typeof v === 'number' ? (this.VEHICLE_TYPES[v] ?? 'Car') : (v ?? 'Car');
    }

    /**
     * Convierte la respuesta del API (DriverResource aplanado) en una entidad Conductor.
     * @param {Object} apiData - DriverResource (camelCase, vehiculo aplanado)
     * @returns {Conductor}
     */
    static fromResponseToEntity(apiData) {
        if (!apiData) {
            throw new Error('Se requieren datos del API para construir un Conductor');
        }

        const vehicle = new Vehicle({
            plate: apiData.vehiclePlate ?? '',
            brand: apiData.vehicleBrand ?? '',
            model: apiData.vehicleModel ?? '',
            year: apiData.vehicleYear ?? 1980,
            capacity: apiData.vehicleCapacity ?? 1,
            type: this._vehicleTypeToStr(apiData.vehicleType)
        });

        return new Conductor({
            id: apiData.id ?? null,
            fkIdUser: apiData.fkIdUser ?? null,
            firstName: apiData.firstName ?? '',
            lastName: apiData.lastName ?? '',
            documentNumber: apiData.documentNumber ?? '',
            phone: apiData.phone ?? '',
            photoUrl: apiData.photoUrl ?? '',
            licenseNumber: apiData.licenseNumber ?? '',
            licenseCategory: this._licenseToStr(apiData.licenseCategory),
            vehicle,
            isAvailable: apiData.isAvailable ?? true,
            createdAt: apiData.createdAt ?? null,
            updatedAt: apiData.updatedAt ?? null
        });
    }

    /**
     * Convierte una entidad Conductor (o datos de formulario) en CreateDriverResource
     * para el POST. El vehiculo se aplana como espera el backend.
     * @param {Conductor|Object} conductor
     * @returns {Object} CreateDriverResource
     */
    static fromEntityToResource(conductor) {
        const vehicle = conductor.vehicle ?? {};
        return {
            fkIdUser: Number(conductor.fkIdUser),
            firstName: conductor.firstName,
            lastName: conductor.lastName,
            documentNumber: conductor.documentNumber,
            phone: conductor.phone,
            photoUrl: conductor.photoUrl ?? '',
            licenseNumber: conductor.licenseNumber,
            licenseCategory: ConductorAssembler._licenseToInt(conductor.licenseCategory),
            vehiclePlate: vehicle.plate,
            vehicleBrand: vehicle.brand,
            vehicleModel: vehicle.model,
            vehicleYear: Number(vehicle.year),
            vehicleCapacity: Number(vehicle.capacity),
            vehicleType: ConductorAssembler._vehicleTypeToInt(vehicle.type)
        };
    }

    /**
     * Payload para PATCH api/v1/drivers/{id} (UpdateDriverResource).
     * @param {Conductor|Object} conductor
     * @returns {Object} UpdateDriverResource
     */
    static fromEntityToUpdateDriver(conductor) {
        return {
            firstName: conductor.firstName,
            lastName: conductor.lastName,
            phone: conductor.phone,
            photoUrl: conductor.photoUrl ?? ''
        };
    }

    /**
     * Payload para PATCH api/v1/drivers/{id}/vehicle (UpdateVehicleResource).
     * @param {Conductor|Object} conductor - se lee conductor.vehicle
     * @returns {Object} UpdateVehicleResource
     */
    static fromEntityToUpdateVehicle(conductor) {
        const vehicle = conductor.vehicle ?? {};
        return {
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: Number(vehicle.year),
            capacity: Number(vehicle.capacity),
            vehicleType: ConductorAssembler._vehicleTypeToInt(vehicle.type)
        };
    }
}
