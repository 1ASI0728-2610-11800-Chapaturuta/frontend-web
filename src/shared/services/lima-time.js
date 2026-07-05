// Lima (Peru) siempre es UTC-5, sin horario de verano. El backend guarda/devuelve
// DateTime en UTC (ISO 8601). Estos helpers convierten entre el input local del
// navegador (datetime-local, en hora de Lima) y el ISO UTC que espera el backend,
// SIN depender de la zona horaria del navegador (evitan `new Date(localString)`).

const LIMA_OFFSET_HOURS = 5 // Lima = UTC-5 => UTC = Lima + 5h

/**
 * Convierte el valor de un <input type="datetime-local"> ("YYYY-MM-DDTHH:mm"),
 * interpretado como hora local de Lima, a un ISO string en UTC.
 * @param {string} value - "YYYY-MM-DDTHH:mm"
 * @returns {string|null} ISO 8601 UTC, o null si el valor es inválido
 */
export function limaLocalInputToUtcIso(value) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) return null
  const [, y, m, d, hh, mm] = match.map(Number)
  const utcMs = Date.UTC(y, m - 1, d, hh + LIMA_OFFSET_HOURS, mm)
  return new Date(utcMs).toISOString()
}

/**
 * Convierte un ISO string en UTC (tal como lo devuelve el backend) al valor
 * equivalente de hora local de Lima para prellenar un <input type="datetime-local">.
 * @param {string} isoUtc
 * @returns {string} "YYYY-MM-DDTHH:mm", o '' si el valor es inválido
 */
export function utcIsoToLimaLocalInput(isoUtc) {
  if (!isoUtc) return ''
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) return ''
  const limaMs = date.getTime() - LIMA_OFFSET_HOURS * 3600 * 1000
  const lima = new Date(limaMs)
  const pad = (n) => String(n).padStart(2, '0')
  const y = lima.getUTCFullYear()
  const m = pad(lima.getUTCMonth() + 1)
  const d = pad(lima.getUTCDate())
  const hh = pad(lima.getUTCHours())
  const mm = pad(lima.getUTCMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

/**
 * Formatea un ISO UTC en hora de Lima, sin importar la zona horaria del navegador.
 * @param {string} isoUtc
 * @param {Intl.DateTimeFormatOptions} opts
 * @param {string} locale
 * @returns {string}
 */
export function formatLima(isoUtc, opts = {}, locale = 'es-PE') {
  if (!isoUtc) return ''
  try {
    return new Date(isoUtc).toLocaleString(locale, { ...opts, timeZone: 'America/Lima' })
  } catch {
    return String(isoUtc)
  }
}

// Mapa de nombres de día en español/inglés, todos normalizados a minúsculas sin tildes.
const DAY_ALIASES = {
  domingo: 0, sunday: 0,
  lunes: 1, monday: 1,
  martes: 2, tuesday: 2,
  miercoles: 3, wednesday: 3,
  jueves: 4, thursday: 4,
  viernes: 5, friday: 5,
  sabado: 6, saturday: 6
}

function normalizeDayName(v) {
  return String(v ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase()
}

function timeToMinutes(hhmm) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/**
 * Valida si una fecha/hora (en hora local de Lima) cae dentro de algún horario
 * habilitado de la ruta. Si no hay horarios habilitados, se considera siempre válido
 * (la fuente de verdad real es el backend; esto es solo UX).
 * @param {Array<{dayOfWeek: string, startTime: string, endTime: string, enabled?: boolean}>} schedules
 * @param {{year: number, month: number, day: number, hour: number, minute: number}|Date} limaWhen
 *        Si es Date, se leen sus componentes LOCALES del navegador (usar solo cuando
 *        ya representan hora de Lima, p.ej. construidos manualmente).
 * @returns {{ valid: boolean, message: string|null }}
 */
export function validateAgainstSchedules(schedules, limaWhen) {
  const enabled = (schedules || []).filter(s => s.enabled !== false)
  if (enabled.length === 0) return { valid: true, message: null }

  let year, month, day, hour, minute
  if (limaWhen instanceof Date) {
    year = limaWhen.getFullYear()
    month = limaWhen.getMonth()
    day = limaWhen.getDate()
    hour = limaWhen.getHours()
    minute = limaWhen.getMinutes()
  } else if (limaWhen) {
    ({ year, month, day, hour, minute } = limaWhen)
  } else {
    return { valid: true, message: null }
  }

  const jsDate = new Date(year, month, day, hour, minute)
  const dayOfWeekIndex = jsDate.getDay()
  const chosenMinutes = hour * 60 + minute

  const daySlots = enabled.filter(s => {
    const idx = DAY_ALIASES[normalizeDayName(s.dayOfWeek)]
    return idx === dayOfWeekIndex
  })

  if (daySlots.length === 0) {
    return { valid: false, message: 'La ruta no atiende ese día. Elige otra fecha u horario.' }
  }

  const withinSlot = daySlots.some(s => {
    const start = timeToMinutes(s.startTime)
    const end = timeToMinutes(s.endTime)
    if (start == null || end == null) return false
    return chosenMinutes >= start && chosenMinutes <= end
  })

  if (!withinSlot) {
    const ranges = daySlots.map(s => `${s.startTime} - ${s.endTime}`).join(', ')
    return { valid: false, message: `Fuera del horario de atención de la ruta (${ranges}).` }
  }

  return { valid: true, message: null }
}
