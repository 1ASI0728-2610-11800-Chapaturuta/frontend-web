export class DriverValidator {
  static required(value) {
    return value !== null && value !== undefined && value.toString().trim() !== ''
  }

  static validateProfile(data) {
    const errors = []
    if (!this.required(data.firstName)) errors.push('Los nombres son requeridos')
    if (!this.required(data.lastName)) errors.push('Los apellidos son requeridos')
    if (!/^\d{8}$/.test(String(data.documentNumber || '').trim())) errors.push('El DNI debe tener 8 digitos')
    if (!/^\d{9,15}$/.test(String(data.phone || '').replace(/\D/g, ''))) errors.push('El telefono debe tener entre 9 y 15 digitos')
    if (!this.required(data.licenseNumber)) errors.push('La licencia es requerida')
    if (!this.required(data.vehiclePlate)) errors.push('La placa del vehiculo es requerida')
    if (!this.required(data.vehicleBrand)) errors.push('La marca del vehiculo es requerida')
    if (!this.required(data.vehicleModel)) errors.push('El modelo del vehiculo es requerido')
    if (!Number(data.vehicleYear) || Number(data.vehicleYear) < 1980) errors.push('El anio del vehiculo debe ser 1980 o mayor')
    if (!Number(data.vehicleCapacity) || Number(data.vehicleCapacity) < 1) errors.push('La capacidad debe ser mayor a cero')
    return errors
  }

  static validateEditable(data) {
    const errors = []
    if (!this.required(data.firstName)) errors.push('Los nombres son requeridos')
    if (!this.required(data.lastName)) errors.push('Los apellidos son requeridos')
    if (!/^\d{9,15}$/.test(String(data.phone || '').replace(/\D/g, ''))) errors.push('El telefono debe tener entre 9 y 15 digitos')
    if (!this.required(data.vehiclePlate)) errors.push('La placa del vehiculo es requerida')
    if (!this.required(data.vehicleBrand)) errors.push('La marca del vehiculo es requerida')
    if (!this.required(data.vehicleModel)) errors.push('El modelo del vehiculo es requerido')
    if (!Number(data.vehicleYear) || Number(data.vehicleYear) < 1980) errors.push('El anio del vehiculo debe ser 1980 o mayor')
    if (!Number(data.vehicleCapacity) || Number(data.vehicleCapacity) < 1) errors.push('La capacidad debe ser mayor a cero')
    return errors
  }
}
