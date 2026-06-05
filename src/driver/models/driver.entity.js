export const LICENSE_CATEGORIES = [
  { label: 'A-IIa', value: 0 },
  { label: 'A-IIb', value: 1 },
  { label: 'A-IIIa', value: 2 },
  { label: 'A-IIIb', value: 3 },
  { label: 'A-IIIc', value: 4 }
]

export const VEHICLE_TYPES = [
  { label: 'Auto', value: 0 },
  { label: 'Pickup', value: 1 },
  { label: 'Combi', value: 2 },
  { label: 'Van', value: 3 },
  { label: 'Bus', value: 4 },
  { label: 'Minivan', value: 5 }
]

export class Driver {
  constructor(data = {}) {
    this.id = data.id ?? null
    this.fkIdUser = data.fkIdUser ?? null
    this.firstName = data.firstName ?? ''
    this.lastName = data.lastName ?? ''
    this.documentNumber = data.documentNumber ?? ''
    this.phone = data.phone ?? ''
    this.photoUrl = data.photoUrl ?? ''
    this.licenseNumber = data.licenseNumber ?? ''
    this.licenseCategory = data.licenseCategory ?? 0
    this.vehiclePlate = data.vehiclePlate ?? ''
    this.vehicleBrand = data.vehicleBrand ?? ''
    this.vehicleModel = data.vehicleModel ?? ''
    this.vehicleYear = data.vehicleYear ?? new Date().getFullYear()
    this.vehicleCapacity = data.vehicleCapacity ?? 1
    this.vehicleType = data.vehicleType ?? 0
    this.isAvailable = data.isAvailable ?? true
    this.createdAt = data.createdAt ?? null
    this.updatedAt = data.updatedAt ?? null
  }
}
