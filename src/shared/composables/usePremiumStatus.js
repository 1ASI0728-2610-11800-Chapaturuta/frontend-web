import { ref, onMounted } from 'vue'
import { SubscriptionService } from '@/subscriptions/services/subscription.service.js'
import { getUserId } from '@/shared/services/session.service.js'

/**
 * Composable reutilizable para saber si el usuario actual (o uno dado) tiene
 * un plan Premium activo. Fuente de verdad: backend (HasActivePremiumPlanAsync).
 *
 * @param {Object} [opts]
 * @param {number} [opts.userId] - usuario a consultar (por defecto el de la sesión)
 * @param {boolean} [opts.immediate=true] - cargar al montar
 */
export function usePremiumStatus(opts = {}) {
  const service = new SubscriptionService()
  const isPremium = ref(false)
  const loading = ref(false)
  const loaded = ref(false)

  async function refresh() {
    const userId = opts.userId ?? getUserId()
    if (!userId) { isPremium.value = false; loaded.value = true; return }
    loading.value = true
    try {
      const res = await service.getPremiumStatus(userId)
      isPremium.value = !!res?.isPremium
    } catch {
      isPremium.value = false
    } finally {
      loading.value = false
      loaded.value = true
    }
  }

  if (opts.immediate !== false) onMounted(refresh)

  return { isPremium, loading, loaded, refresh }
}
