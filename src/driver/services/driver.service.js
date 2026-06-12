import { BaseService } from '@/shared/services/base-service.js'

export class DriverService extends BaseService {
  constructor() {
    super('v1/drivers')
  }

  async getDriverByUserId(userId) {
    const response = await this.http.get(`${this.resourcePath()}/by-user/${userId}`)
    return response.data
  }

  async createDriver(driver) {
    const response = await this.http.post(this.resourcePath(), {
      fkIdUser: Number(driver.fkIdUser),
      firstName: driver.firstName,
      lastName: driver.lastName,
      documentNumber: driver.documentNumber,
      phone: driver.phone,
      photoUrl: driver.photoUrl || '',
      licenseNumber: driver.licenseNumber,
      licenseCategory: Number(driver.licenseCategory),
      vehiclePlate: driver.vehiclePlate,
      vehicleBrand: driver.vehicleBrand,
      vehicleModel: driver.vehicleModel,
      vehicleYear: Number(driver.vehicleYear),
      vehicleCapacity: Number(driver.vehicleCapacity),
      vehicleType: Number(driver.vehicleType)
    })
    return response.data
  }

  async updateDriver(driverId, driver) {
    const response = await this.http.patch(`${this.resourcePath()}/${driverId}`, {
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      photoUrl: driver.photoUrl || ''
    })
    return response.data
  }

  async updateVehicle(driverId, driver) {
    const response = await this.http.patch(`${this.resourcePath()}/${driverId}/vehicle`, {
      plate: driver.vehiclePlate,
      brand: driver.vehicleBrand,
      model: driver.vehicleModel,
      year: Number(driver.vehicleYear),
      capacity: Number(driver.vehicleCapacity),
      vehicleType: Number(driver.vehicleType)
    })
    return response.data
  }

  async toggleAvailability(driverId) {
    const response = await this.http.patch(`${this.resourcePath()}/${driverId}/availability`)
    return response.data
  }

  async uploadPhoto(driverId, file) {
    const formData = new FormData()
    // ASP.NET enlaza el campo al parámetro `IFormFile file` (case-insensitive)
    formData.append('File', file)
    const response = await this.http.post(`${this.resourcePath()}/${driverId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}
