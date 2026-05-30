import { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyQStashSignature } from '@/lib/qstash'
import { simulateEngagement } from '@/lib/simulation'
import { publishToInstagram, refreshLongLived } from '@/lib/instagram'

interface RouteParams {
  params: Promise<{ postId: string }>
}

// Cuenta social con lo necesario para publicar de verdad.
interface AccountRow {
  id: string
  network: string
  is_simulated: boolean
  access_token: string | null
  external_user_id: string | null
  token_expires_at: string | null
}

// Refresca el token si vence en <10 días (Meta sólo refresca tokens con >24h de
// vida). Si el refresh falla, devolvemos el token actual y dejamos que el
// publish surfacee el error real. Persiste el token nuevo en la DB.
async function ensureValidInstagramToken(
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
    console.error(`[qstash/publish] no se pudo refrescar el token IG ${account.id}:`, err)
    return token
  }
}

/**
 * POST /api/qstash/publish/:postId
 *
 * Endpoint que QStash llama cuando llega la fecha programada de un post.
 * NO tiene sesión de usuario (QStash llama sin cookies) → usa el admin client
 * y se protege con la firma HMAC de QStash.
 *
 * Publica DE VERDAD en las redes con cuenta real (hoy: Instagram, is_simulated
 * =false) y SIMULA el resto. Es idempotente: si QStash reintenta, las
 * publicaciones ya resueltas se saltean (no se re-publica en Instagram).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params
  try {
    return await handlePublish(request, postId)
  } catch (err) {
    // Cualquier error inesperado: lo logueamos con detalle y devolvemos 500
    // (QStash reintentará; la operación es idempotente).
    console.error(`[qstash/publish] Error inesperado publicando post ${postId}:`, err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return Response.json({ error: message }, { status: 500 })
  }
}

async function handlePublish(request: NextRequest, postId: string) {
  // 1. Verificar firma de QStash (necesita el body crudo).
  const rawBody = await request.text()
  const valid = await verifyQStashSignature(request, rawBody)
  if (!valid) {
    return Response.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 2. Buscar el post (con lo necesario para armar el caption y publicar).
  //    Si no existe (se borró entre el encolado y el callback), 200 para que
  //    QStash NO reintente.
  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('id, status, client_id, description, hashtags, media_urls')
    .eq('id', postId)
    .single()

  if (pErr || !post) {
    return Response.json({ skipped: 'post_not_found' }, { status: 200 })
  }

  // 3. Si ya no está programado (el CM lo canceló/despublicó y el cancel de la
  //    cola falló), no hacemos nada. 200 para no reintentar.
  if (post.status !== 'scheduled') {
    return Response.json({ skipped: 'not_scheduled' }, { status: 200 })
  }

  const now = new Date().toISOString()

  // 4. Cuentas conectadas del cliente (para saber cuáles son reales).
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

  // 5. Resolver cada publication. Idempotente: las ya resueltas se saltean
  //    (clave para no re-publicar en Instagram si QStash reintenta).
  const { data: pubs } = await supabase
    .from('post_publications')
    .select('id, network, status')
    .eq('post_id', postId)

  const results: string[] = [] // estado final de cada pub (para el agregado)

  for (const pub of (pubs ?? []) as { id: string; network: string; status: string }[]) {
    if (pub.status === 'published' || pub.status === 'simulated') {
      results.push(pub.status)
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
        results.push('published')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        console.error(`[qstash/publish] Instagram falló (pub ${pub.id}):`, message)
        await supabase
          .from('post_publications')
          .update({ status: 'failed', error_message: message.slice(0, 500), published_at: null })
          .eq('id', pub.id)
        results.push('failed')
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
      results.push('simulated')
    }
  }

  // 6. Estado agregado del post: 'failed' sólo si TODAS las redes fallaron;
  //    si alguna se publicó/simuló, queda 'published'. Limpiamos el message_id.
  const allFailed = results.length > 0 && results.every((r) => r === 'failed')
  const { error: updPostErr } = await supabase
    .from('posts')
    .update({
      status: allFailed ? 'failed' : 'published',
      qstash_message_id: null,
      updated_at: now,
    })
    .eq('id', postId)

  if (updPostErr) {
    // 500 → QStash reintenta (las pubs ya resueltas se saltean, no se duplica).
    console.error(`[qstash/publish] Error actualizando post ${postId}:`, updPostErr.message)
    return Response.json({ error: updPostErr.message }, { status: 500 })
  }

  return Response.json({ published: !allFailed, results }, { status: 200 })
}
