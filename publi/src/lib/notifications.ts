import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationType } from '@/types'

interface CreateNotificationParams {
  userId: string
  postId: string
  clientId: string
  postTitle: string
  status: 'published' | 'failed'
  results: { network: string; status: string; error?: string }[]
}

/**
 * Crea una notificación en la DB informando el resultado de la publicación.
 *
 * Se llama desde `publishPostPublications` al terminar de publicar un post,
 * tanto en el flujo de "Publicar ahora" como en el de QStash (programado).
 */
export async function createPublishNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
): Promise<void> {
  const { userId, postId, clientId, postTitle, status, results } = params

  const type: NotificationType = status === 'published' ? 'post_published' : 'post_failed'

  const label = postTitle || 'Sin título'

  let title: string
  let body: string

  if (status === 'published') {
    const networks = results
      .filter((r) => r.status === 'published' || r.status === 'simulated')
      .map((r) => r.network)
    title = '✅ Publicación exitosa'
    body = `"${label}" se publicó en ${formatNetworks(networks)}.`
  } else {
    const failedNetworks = results.filter((r) => r.status === 'failed')
    const firstError = failedNetworks[0]?.error ?? 'Error desconocido'
    title = '❌ Publicación fallida'
    body = `"${label}" falló en ${formatNetworks(failedNetworks.map((r) => r.network))}. ${firstError}`
  }

  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body.slice(0, 500),
      post_id: postId,
      client_id: clientId,
    })
    if (error) {
      console.error('[notifications] Error al crear notificación en base de datos:', error)
    }
  } catch (err) {
    // No propagamos el error para no afectar el flujo de publicación.
    console.error('[notifications] Error al crear notificación (ex):', err)
  }
}

function formatNetworks(networks: string[]): string {
  if (networks.length === 0) return 'redes'
  if (networks.length === 1) return capitalize(networks[0])
  const last = networks.pop()!
  return `${networks.map(capitalize).join(', ')} y ${capitalize(last)}`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
