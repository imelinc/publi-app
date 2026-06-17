import type { SupabaseClient } from '@supabase/supabase-js'

export interface DailyUsageResult {
  used: number
  limit: number
  remaining: number
  windowStart: string
  nextSlotAvailableAt: string | null
}

/**
 * Calcula el uso de publicaciones de Instagram de un cliente en una ventana móvil de 24 horas.
 * Suma las publicaciones realizadas ('published') en las últimas 24hs más las programadas ('scheduled')
 * para las próximas 24hs (que consumirán cupo al publicarse).
 */
export async function getDailyUsage(
  clientId: string,
  supabase: SupabaseClient
): Promise<DailyUsageResult> {
  const limit = 25
  const now = new Date()
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  // Consulta única usando OR de PostgREST para obtener publicaciones reales o programadas en la ventana móvil
  // Filtramos además por la red 'instagram'
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, status, published_at, scheduled_at')
    .eq('client_id', clientId)
    .contains('networks', ['instagram'])
    .or(
      `and(status.eq.published,published_at.gte.${windowStart}),and(status.eq.scheduled,scheduled_at.gte.${windowStart},scheduled_at.lte.${windowEnd})`
    )

  if (error) {
    console.error(`[instagram-rate-limit] Error querying daily usage for client ${clientId}:`, error)
    throw new Error(`Error al consultar el límite diario: ${error.message}`)
  }

  const used = posts?.length ?? 0
  const remaining = Math.max(0, limit - used)

  let nextSlotAvailableAt: string | null = null

  if (remaining <= 0 && posts && posts.length > 0) {
    // Buscar la publicación más antigua en la ventana móvil
    let oldestMs = Infinity
    for (const post of posts) {
      const timeStr = post.status === 'published' ? post.published_at : post.scheduled_at
      if (timeStr) {
        const ms = new Date(timeStr).getTime()
        if (ms < oldestMs) {
          oldestMs = ms
        }
      }
    }

    if (oldestMs !== Infinity) {
      // Se libera 24 horas después de la publicación más vieja
      nextSlotAvailableAt = new Date(oldestMs + 24 * 60 * 60 * 1000).toISOString()
    }
  }

  return {
    used,
    limit,
    remaining,
    windowStart,
    nextSlotAvailableAt,
  }
}
