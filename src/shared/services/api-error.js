/**
 * Extrae un mensaje de error legible desde una respuesta del backend.
 *
 * El backend devuelve distintas formas:
 *  - ProblemDetails (GlobalExceptionHandler): { title, detail, status }
 *  - Controllers con try/catch: { message }
 *  - ModelState ([Required] / [ApiController]): { errors: { campo: [msg] }, title }
 *
 * @param {*} err - error enriquecido (con .data / .status) o Error de axios
 * @param {string} fallback - mensaje por defecto si no se encuentra nada útil
 * @returns {string}
 */
export function extractApiError(err, fallback = 'Ocurrió un error. Inténtalo de nuevo.') {
  const data = err?.data ?? err?.response?.data

  if (data) {
    // ProblemDetails.detail (excepciones de dominio / command-services)
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim()
    // Controllers que devuelven { message }
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim()
    // ModelState / ValidationProblemDetails: { errors: { campo: [msg, ...] } }
    if (data.errors && typeof data.errors === 'object') {
      for (const key of Object.keys(data.errors)) {
        const v = data.errors[key]
        const msg = Array.isArray(v) ? v[0] : v
        if (typeof msg === 'string' && msg.trim()) return msg.trim()
      }
    }
    // Title de ProblemDetails como último recurso del body
    if (typeof data.title === 'string' && data.title.trim() && data.title !== 'Bad Request') {
      return data.title.trim()
    }
    // A veces el body es un string plano
    if (typeof data === 'string' && data.trim()) return data.trim()
  }

  // Timeout / red caída
  if (err?.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Revisa tu conexión.'
  if (err?.message === 'Network Error') return 'No se pudo conectar con el servidor.'

  if (typeof err?.message === 'string' && err.message.trim() && !/status code/i.test(err.message)) {
    return err.message.trim()
  }

  return fallback
}
