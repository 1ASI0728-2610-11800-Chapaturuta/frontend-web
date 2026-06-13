/**
 * Validadores puros reutilizables. Cada función devuelve '' si el valor es válido,
 * o un mensaje en español explicando la regla. Espejan las validaciones del backend
 * para evitar 400/409 evitables y explicarle al usuario qué corregir.
 */

const isBlank = (v) => v === null || v === undefined || String(v).trim() === ''

export function required(v, label = 'Este campo') {
  return isBlank(v) ? `${label} es obligatorio.` : ''
}

export function maxLen(v, max, label = 'Este campo') {
  if (isBlank(v)) return ''
  return String(v).trim().length > max ? `${label} no puede superar ${max} caracteres.` : ''
}

export function minLen(v, min, label = 'Este campo') {
  if (isBlank(v)) return ''
  return String(v).trim().length < min ? `${label} debe tener al menos ${min} caracteres.` : ''
}

export function email(v) {
  if (isBlank(v)) return 'El email es obligatorio.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? '' : 'Ingresa un email válido (ej. nombre@correo.com).'
}

// Contrato del sign-up: mínimo 8 caracteres, al menos una mayúscula y un número.
export function passwordStrong(v) {
  if (isBlank(v)) return 'La contraseña es obligatoria.'
  const s = String(v)
  if (s.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(s)) return 'La contraseña debe incluir al menos una mayúscula.'
  if (!/[0-9]/.test(s)) return 'La contraseña debe incluir al menos un número.'
  return ''
}

// DNI peruano: exactamente 8 dígitos.
export function dni(v) {
  if (isBlank(v)) return 'El documento es obligatorio.'
  return /^\d{8}$/.test(String(v).trim()) ? '' : 'El DNI debe tener exactamente 8 dígitos.'
}

// Celular peruano: 9 dígitos, empieza en 9.
export function phonePe(v) {
  if (isBlank(v)) return 'El teléfono es obligatorio.'
  return /^9\d{8}$/.test(String(v).trim()) ? '' : 'El teléfono debe tener 9 dígitos y empezar con 9.'
}

// > 0 (precio, duración, frecuencia, monto).
export function positiveNumber(v, label = 'El valor') {
  if (isBlank(v)) return `${label} es obligatorio.`
  const n = Number(v)
  if (Number.isNaN(n)) return `${label} debe ser numérico.`
  return n > 0 ? '' : `${label} debe ser mayor que 0.`
}

export function nonNegative(v, label = 'El valor') {
  if (isBlank(v)) return `${label} es obligatorio.`
  const n = Number(v)
  if (Number.isNaN(n)) return `${label} debe ser numérico.`
  return n >= 0 ? '' : `${label} no puede ser negativo.`
}

// Entero >= min.
export function integerMin(v, min, label = 'El valor') {
  if (isBlank(v)) return `${label} es obligatorio.`
  const n = Number(v)
  if (!Number.isInteger(n)) return `${label} debe ser un número entero.`
  return n >= min ? '' : `${label} debe ser al menos ${min}.`
}

// Año del vehículo: >= 1980 y no futuro lejano.
export function yearMin(v, min = 1980) {
  if (isBlank(v)) return 'El año es obligatorio.'
  const n = Number(v)
  if (!Number.isInteger(n)) return 'El año debe ser un número entero.'
  const maxYear = 2027
  if (n < min) return `El año debe ser ${min} o posterior.`
  if (n > maxYear) return `El año no puede ser mayor a ${maxYear}.`
  return ''
}

// Placa peruana: 6-7 alfanuméricos, opcionalmente con guion (ABC-123, A1B-234).
export function plate(v) {
  if (isBlank(v)) return 'La placa es obligatoria.'
  return /^[A-Za-z0-9]{3}-?[A-Za-z0-9]{3,4}$/.test(String(v).trim())
    ? ''
    : 'Placa inválida (ej. ABC-123).'
}

// Monto <= máximo (reembolso <= pago).
export function maxAmount(v, max, label = 'El monto') {
  if (isBlank(v)) return `${label} es obligatorio.`
  const n = Number(v)
  if (Number.isNaN(n)) return `${label} debe ser numérico.`
  if (n <= 0) return `${label} debe ser mayor que 0.`
  return n > Number(max)
    ? `${label} no puede superar S/ ${Number(max).toFixed(2)}.`
    : ''
}

export function score1to5(v) {
  const n = Number(v)
  return n >= 1 && n <= 5 ? '' : 'La calificación debe estar entre 1 y 5.'
}

// Bounding box de Perú (espeja PeruBounds del backend de stops).
const PERU_BOUNDS = { minLat: -18.5, maxLat: 0.1, minLng: -81.5, maxLng: -68.5 }
export function peruBounds(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return 'Selecciona una ubicación en el mapa.'
  }
  const okLat = lat >= PERU_BOUNDS.minLat && lat <= PERU_BOUNDS.maxLat
  const okLng = lng >= PERU_BOUNDS.minLng && lng <= PERU_BOUNDS.maxLng
  return okLat && okLng ? '' : 'La ubicación debe estar dentro de Perú.'
}

// ── Tarjeta ──────────────────────────────────────────────────────────────────
export function cardNumber(v) {
  const digits = String(v || '').replace(/\D/g, '')
  if (!digits) return 'El número de tarjeta es obligatorio.'
  if (digits.length < 13 || digits.length > 19) return 'Número de tarjeta inválido.'
  return ''
}

export function expiryMMYY(v) {
  if (isBlank(v)) return 'El vencimiento es obligatorio.'
  if (!/^\d{2}\/\d{2}$/.test(String(v).trim())) return 'Vencimiento inválido (MM/AA).'
  const [mm] = String(v).split('/')
  const month = Number(mm)
  return month >= 1 && month <= 12 ? '' : 'El mes de vencimiento debe estar entre 01 y 12.'
}

export function cvv(v) {
  if (isBlank(v)) return 'El CVV es obligatorio.'
  return /^\d{3,4}$/.test(String(v).trim()) ? '' : 'El CVV debe tener 3 o 4 dígitos.'
}

/**
 * Corre una lista de validadores sobre un valor y devuelve el primer error.
 * @param {*} value
 * @param {Array<Function>} rules - funciones que reciben value y devuelven '' o mensaje
 */
export function runRules(value, rules) {
  for (const rule of rules) {
    const msg = rule(value)
    if (msg) return msg
  }
  return ''
}

/**
 * Devuelve el primer mensaje de error de un mapa { campo: mensaje }, o '' si todo válido.
 */
export function firstError(errorMap) {
  for (const key of Object.keys(errorMap)) {
    if (errorMap[key]) return errorMap[key]
  }
  return ''
}

/** True si el mapa de errores no tiene ningún mensaje. */
export function isValidMap(errorMap) {
  return Object.values(errorMap).every((m) => !m)
}
