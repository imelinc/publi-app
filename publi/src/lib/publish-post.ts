import type { SupabaseClient } from '@supabase/supabase-js'
import { publishToInstagram, refreshLongLived } from '@/lib/instagram'
import { simulateEngagement } from '@/lib/simulation'

/**
 * Servicio compartido de publicación de un post en sus redes.
 *
 * Lo usan tanto el callback de QStash (publicaciones programadas) como el
 * endpoint de "Publicar ahora" (`/api/posts/[postId]/publish`). Publica DE
 * VERDAD en las redes con cuenta real (hoy: Instagram con is_simulated=false)
 * y SIMULA el resto.
 *
 * Es idempotente: las post_publications ya resueltas (published/simulated) se
 * saltean, así un reintento (QStash) o un doble click no re-publican en IG.
 */

// Cuenta social con lo necesario para publicar de verdad.
export interface AccountRow {
  id: string
  network: string
  is_simulated: boolean
  access_token: string | null
  external_user_id: string | null
  token_expires_at: string | null
}

export interface PublishResult {
  status: 'published' | 'failed'
  results: { network: string; status: string; error?: string }[]
}

/**
 * Refresca el token de IG si vence en <10 días (Meta sólo refresca tokens con
 * >24h de vida). Si el refresh falla, devuelve el token actual y deja que el
 * publish surfacee el error real. Persiste el token nuevo en la DB.
 */
export async function ensureValidInstagramToken(
  supabase: SupabaseClient,
  account: AccountRow
): Promise<string> {
  const token = account.access_token ?? ''
  const expMs = account.token_expires_at
    ? new Date(account.token_expires_at).getTime()
    : 0
  const tenDays = 10 * 24 * 60 * 60 * 1000
  if (!token || expMs - Date.now() > tenDays) return token
  try {
    const refreshed = await refreshLongLived(token)
    const newExp = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
    await supabase
      .from('social_accounts')
      .update({ access_token: refreshed.accessToken, token_expires_at: newExp })
      .eq('id', account.id)
    return refreshed.accessToken
  } catch (err) {
    console.error(`[publish] no se pudo refrescar el token IG ${account.id}:`, err)
    return token
  }
}

/**
 * Publica todas las post_publications pendientes de un post y deja el estado
 * agregado del post (`published` si al menos una salió, `failed` si todas
 * fallaron). Devuelve el detalle por red.
 *
 * Asume que el post existe y que ya se validó el permiso del caller.
 */
export async function publishPostPublications(
  supabase: SupabaseClient,
  postId: string,
  preloadedPost?: {
    client_id: string
    description: string | null
    hashtags: string[] | null
    media_urls: string[] | null
  }
): Promise<PublishResult> {
  const post = preloadedPost ?? await (async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, client_id, description, hashtags, media_urls')
      .eq('id', postId)
      .single()
    return data
  })()

  if (!post) {
    console.error(`[publish] post ${postId} no encontrado`)
    return { status: 'failed', results: [] }
  }

  const now = new Date().toISOString()

  // Cuentas conectadas del cliente (para saber cuáles son reales).
  const accountsByNetwork = new Map<string, AccountRow>()
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id, network, is_simulated, access_token, external_user_id, token_expires_at')
    .eq('client_id', post.client_id as string)
  for (const a of (accounts ?? []) as AccountRow[]) {
    accountsByNetwork.set(a.network, a)
  }

  // Caption real: descripción + hashtags.
  const tags = ((post.hashtags as string[] | null) ?? [])
    .map((h) => (h.startsWith('#') ? h : `#${h}`))
    .join(' ')
  const caption = [post.description as string | null, tags].filter(Boolean).join('\n\n')
  const mediaUrls = (post.media_urls as string[] | null) ?? []

  // Resolver cada publication. Las ya resueltas se saltean (idempotencia).
  const { data: pubs } = await supabase
    .from('post_publications')
    .select('id, network, status')
    .eq('post_id', postId)

  const results: { network: string; status: string; error?: string }[] = []

  for (const pub of (pubs ?? []) as { id: string; network: string; status: string }[]) {
    if (pub.status === 'published' || pub.status === 'simulated') {
      results.push({ network: pub.network, status: pub.status })
      continue
    }

    const account = accountsByNetwork.get(pub.network)
    const isRealInstagram =
      pub.network === 'instagram' && account && !account.is_simulated && account.access_token

    if (isRealInstagram) {
      // Publicación REAL en Instagram.
      try {
        const token = await ensureValidInstagramToken(supabase, account!)
        const mediaId = await publishToInstagram({
          igUserId: account!.external_user_id ?? '',
          accessToken: token,
          imageUrls: mediaUrls,
          caption,
        })
        await supabase
          .from('post_publications')
          .update({
            status: 'published',
            external_post_id: mediaId,
            published_at: now,
            error_message: null,
          })
          .eq('id', pub.id)
        results.push({ network: pub.network, status: 'published' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        console.error(`[publish] Instagram falló (pub ${pub.id}):`, message)
        await supabase
          .from('post_publications')
          .update({ status: 'failed', error_message: message.slice(0, 500), published_at: null })
          .eq('id', pub.id)
        results.push({ network: pub.network, status: 'failed', error: message })
      }
    } else {
      // Red simulada (o sin cuenta real) → métricas plausibles.
      const eng = simulateEngagement(pub.id)
      await supabase
        .from('post_publications')
        .update({
          status: 'simulated',
          published_at: now,
          likes: eng.likes,
          comments: eng.comments,
          views: eng.views,
          reach: eng.reach,
        })
        .eq('id', pub.id)
      results.push({ network: pub.network, status: 'simulated' })
    }
  }

  // Estado agregado: 'failed' sólo si TODAS fallaron; si no, 'published'.
  const allFailed = results.length > 0 && results.every((r) => r.status === 'failed')
  const finalStatus: 'published' | 'failed' = allFailed ? 'failed' : 'published'
  await supabase
    .from('posts')
    .update({ status: finalStatus, qstash_message_id: null, updated_at: now })
    .eq('id', postId)

  return { status: finalStatus, results }
}
