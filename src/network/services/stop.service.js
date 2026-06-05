import { BaseService } from '@/shared/services/base-service.js'
import { StopEntity } from '../models/stop.entity'
import { GeographyService } from '@/geography/services/geography.service.js'
import { DriverService } from '@/driver/services/driver.service.js'
import { getDriverId } from '@/shared/services/session.service.js'

export class StopService extends BaseService {
  constructor() {
    super('stops')
    this.geographyService = new GeographyService()
    this.driverService = new DriverService()
  }

  async getStopsByDriverId(driverId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`)
      const stops = response.data || []

      return Promise.all(stops.map(async stop => {
        try {
          const locationDetails = await this.geographyService.getLocationDetails(stop.fkIdDistrict)
          const driverName = await this._getDriverName(stop.fkIdDriver)
          return {
            ...stop,
            fk_id_driver: stop.fkIdDriver,
            fk_id_company: stop.fkIdDriver,
            fk_id_district: stop.fkIdDistrict,
            google_maps_url: stop.googleMapsUrl,
            image_url: stop.imageUrl,
            location: locationDetails?.fullPath || 'Ubicacion no disponible',
            driverName
          }
        } catch {
          return {
            ...stop,
            fk_id_driver: stop.fkIdDriver,
            fk_id_company: stop.fkIdDriver,
            fk_id_district: stop.fkIdDistrict,
            google_maps_url: stop.googleMapsUrl,
            image_url: stop.imageUrl,
            location: 'Ubicacion no disponible',
            driverName: 'Conductor no disponible'
          }
        }
      }))
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async getStopsByCompanyId(companyId) {
    return this.getStopsByDriverId(companyId)
  }

  async getStopsForSelect(driverId) {
    try {
      if (!driverId) throw new Error('ID de conductor invalido')
      const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`)
      return (response.data || []).map(stop => ({
        label: stop.name,
        value: stop.id
      }))
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async deleteStop(id) {
    try {
      if (!id || typeof id !== 'number' || !Number.isInteger(id) || id < 0) {
        throw new Error('ID de paradero invalido')
      }
      await super.delete(id)
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async updateStop(id, updateData) {
    try {
      if (!id || typeof id !== 'number' || !Number.isInteger(id) || id < 0) {
        throw new Error('ID de paradero invalido')
      }
      this._validateStopData(updateData)

      const driverId = this._getDriverIdFromLocalStorage()
      const current = await super.getById(id)
      const updatedData = {
        id: Number(current.id),
        name: updateData.name,
        googleMapsUrl: updateData.googleMapsUrl ?? updateData.google_maps_url ?? current.googleMapsUrl ?? '',
        imageUrl: updateData.imageUrl ?? updateData.image_url ?? current.imageUrl ?? '',
        fkIdDriver: Number(driverId),
        address: updateData.address,
        reference: updateData.reference,
        fkIdDistrict: Number(updateData.fk_id_district ?? updateData.fkIdDistrict),
        latitude: updateData.latitude ?? updateData.lat ?? current.latitude,
        longitude: updateData.longitude ?? updateData.lng ?? current.longitude
      }

      const response = await super.update(id, updatedData)
      return this._toEntity(response)
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async createStop(stopData) {
    try {
      this._validateStopData(stopData)
      const driverId = this._getDriverIdFromLocalStorage()
      const formData = new FormData()
      const lat = stopData.latitude ?? stopData.lat
      const lng = stopData.longitude ?? stopData.lng
      const googleMapsUrl = stopData.google_maps_url
        || stopData.googleMapsUrl
        || (lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : '')

      formData.append('Name', stopData.name)
      formData.append('Address', stopData.address)
      formData.append('Reference', stopData.reference)
      formData.append('FkIdDriver', String(driverId))
      formData.append('FkIdDistrict', String(stopData.fk_id_district ?? stopData.fkIdDistrict))
      formData.append('GoogleMapsUrl', googleMapsUrl)
      if (lat != null) formData.append('Latitude', String(lat))
      if (lng != null) formData.append('Longitude', String(lng))
      if (stopData.imageFile) formData.append('ImageFile', stopData.imageFile)

      const response = await this.http.post(this.resourcePath(), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      return this._toEntity(response.data)
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async _getDriverName(driverId) {
    try {
      const driver = await this.driverService.getById(driverId)
      return `${driver?.firstName || ''} ${driver?.lastName || ''}`.trim() || 'Desconocido'
    } catch {
      return 'Desconocido'
    }
  }

  _toEntity(data) {
    return new StopEntity(
      data.id,
      data.name,
      data.googleMapsUrl,
      data.imageUrl,
      data.fkIdDriver,
      data.fkIdDistrict,
      data.address,
      data.reference
    )
  }

  _validateStopData(data) {
    const requiredFields = {
      name: 'string',
      address: 'string',
      reference: 'string'
    }

    Object.entries(requiredFields).forEach(([field, type]) => {
      if (!data[field] || typeof data[field] !== type) {
        throw new Error(`Campo requerido: ${field}`)
      }
    })
  }

  _getDriverIdFromLocalStorage() {
    const driverId = getDriverId()
    if (!driverId) throw new Error('No se pudo obtener el ID del conductor')
    return Number(driverId)
  }

  _enhanceError(error) {
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.error || error.message
      switch (status) {
        case 400: return new Error(`Datos invalidos: ${message}`)
        case 401: return new Error('No autorizado. Por favor, inicia sesion nuevamente.')
        case 403: return new Error('No tienes permisos para realizar esta accion.')
        case 404: return new Error('Recurso no encontrado.')
        case 500: return new Error('Error interno del servidor. Intenta nuevamente.')
        default: return new Error(`Error ${status}: ${message}`)
      }
    }
    if (error.request) return new Error('Error de conexion. Verifica tu conexion a internet.')
    return error
  }
}
