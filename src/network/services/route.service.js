import { BaseService } from '@/shared/services/base-service.js'
import { StopService } from '@/network/services/stop.service.js'

export class RouteService extends BaseService {
  constructor() {
    super('routes')
    this.stopsService = new StopService()
  }

  async createFullRoute(routeInfo, scheduleData) {
    try {
      const dayLabels = {
        sunday: 'Domingo',
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miercoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sabado'
      }
      const schedules = Object.entries(scheduleData)
        .filter(([_, day]) => day.enabled)
        .map(([key, day]) => ({
          dayOfWeek: dayLabels[key] || key,
          startTime: day.startTime,
          endTime: day.endTime,
          enabled: day.enabled
        }))

      const requestBody = {
        frequency: Number(routeInfo.frequency),
        price: Number(routeInfo.price),
        duration: Number(routeInfo.duration),
        stopsIds: [routeInfo.selectedFirstStop, routeInfo.selectedSecondStop].map(Number),
        schedules
      }
      const response = await this.http.post(this.resourcePath(), requestBody)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async loadRoutesByDriverId(driverId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/driver/${driverId}`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async getByRouteId(routeId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/${routeId}`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async getGeometry(routeId) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/${routeId}/geometry`)
      return decodeGeometry(response.data?.geometry ?? response.data)
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async getEta(routeId, { lat, lng } = {}) {
    try {
      const response = await this.http.get(`${this.resourcePath()}/${routeId}/eta`, {
        params: { lat, lng }
      })
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async toggleAvailability(routeId) {
    try {
      const response = await this.http.patch(`${this.resourcePath()}/${routeId}/toggle-availability`)
      return response.data
    } catch (error) {
      throw this._enhanceError(error)
    }
  }

  async previewRoute(coordinates) {
    try {
      const response = await this.http.post(`${this.resourcePath()}/preview`, { coordinates })
      return {
        distanceMeters: response.data.distanceMeters,
        durationSeconds: response.data.durationSeconds,
        latLngs: decodeGeometry(response.data.geometry)
      }
    } catch (error) {
      throw this._enhanceError(error)
    }
  }
}

function decodeGeometry(geom) {
  if (!geom) return []
  if (Array.isArray(geom)) {
    return geom.map(p => Array.isArray(p) ? [p[1] ?? p[0], p[0] ?? p[1]] : [p.lat, p.lng])
  }
  if (typeof geom === 'object' && geom.coordinates) {
    return geom.coordinates.map(([lng, lat]) => [lat, lng])
  }
  if (typeof geom === 'string') return decodePolyline(geom)
  return []
}

function decodePolyline(str, precision = 5) {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates = []
  const factor = Math.pow(10, precision)
  while (index < str.length) {
    let result = 1
    let shift = 0
    let b
    do {
      b = str.charCodeAt(index++) - 63 - 1
      result += b << shift
      shift += 5
    } while (b >= 0x1f)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)
    result = 1
    shift = 0
    do {
      b = str.charCodeAt(index++) - 63 - 1
      result += b << shift
      shift += 5
    } while (b >= 0x1f)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)
    coordinates.push([lat / factor, lng / factor])
  }
  return coordinates
}
