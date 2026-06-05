import { discoveryService } from '@/discovery/services/discovery.service.js'

/**
 * Lee el id del usuario autenticado desde localStorage (`user.id`).
 * Se usa para aplicar la cuota del plan de suscripción en Discovery.
 * @returns {number|string|undefined}
 */
function currentUserId() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return undefined
    const user = JSON.parse(raw)
    return user?.id
  } catch {
    return undefined
  }
}

/**
 * Wrapper de compatibilidad para los consumidores existentes
 * (p.ej. `nearby-stops.component.vue`). Delega en {@link DiscoveryService}
 * y añade automáticamente `userId` desde localStorage si no se provee.
 *
 * Mantiene la firma original `nearby({ lat, lng, radius, useRoadDistance })`.
 * NOTA: el backend interpreta `radius` en KILÓMETROS (default 2.0).
 */
export class DiscoveryNearbyService {
  async nearby({ lat, lng, radius = 2.0, useRoadDistance = false, userId } = {}) {
    return discoveryService.nearby({
      userId: userId ?? currentUserId(),
      lat,
      lng,
      radius,
      useRoadDistance
    })
  }
}
