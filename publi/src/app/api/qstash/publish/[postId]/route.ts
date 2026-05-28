import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyQStashSignature } from '@/lib/qstash'
import { simulateEngagement } from '@/lib/simulation'

interface RouteParams {
  params: Promise<{ postId: string }>
}

/**
 * POST /api/qstash/publish/:postId
 *
 * Endpoint que QStash llama cuando llega la fecha programada de un post.
 * NO tiene sesión de usuario (QStash llama sin cookies) → usa el admin client
 * y se protege con la firma HMAC de QStash.
 *
 * Hoy SIMULA la publicación. En el futuro, para redes con cuenta real
 * (is_simulated=false), va a hacer la llamada real a la API de la red.
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

  // 2. Buscar el post. Si no existe (se borró entre el encolado y el callback),
  //    respondemos 200 para que QStash NO reintente.
  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('id, status')
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

  // 4. Marcar el post como publicado y limpiar el message_id (ya se consumió).
  //    OJO: published_at NO vive en `posts` sino en `post_publications`
  //    (ver dashboard/page.tsx). Acá solo tocamos status/message_id.
  const { error: updPostErr } = await supabase
    .from('posts')
    .update({ status: 'published', qstash_message_id: null, updated_at: now })
    .eq('id', postId)

  if (updPostErr) {
    // 500 → QStash reintenta más tarde (la operación es idempotente).
    console.error(
      `[qstash/publish] Error actualizando post ${postId}:`,
      updPostErr.message,
      updPostErr
    )
    return Response.json({ error: updPostErr.message }, { status: 500 })
  }

  // 5. Resolver qué redes del cliente están simuladas.
  const { data: clientRow } = await supabase
    .from('posts')
    .select('client_id')
    .eq('id', postId)
    .single()

  const clientId = clientRow?.client_id as string | undefined

  const simulatedByNetwork = new Map<string, boolean>()
  if (clientId) {
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('network, is_simulated')
      .eq('client_id', clientId)
    for (const a of (accounts ?? []) as { network: string; is_simulated: boolean }[]) {
      simulatedByNetwork.set(a.network, a.is_simulated)
    }
  }

  // 6. Publicar cada red.
  const { data: pubs } = await supabase
    .from('post_publications')
    .select('id, network, status')
    .eq('post_id', postId)

  for (const pub of (pubs ?? []) as { id: string; network: string; status: string }[]) {
    if (simulatedByNetwork.get(pub.network)) {
      // Red simulada → marcamos publicada con métricas plausibles.
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
    } else {
      // TODO: when is_simulated=false, llamar a la API real de la red
      // correspondiente (Instagram Graph API, etc), guardar external_post_id
      // y en caso de error marcar status='failed' con error_message.
      // Por ahora la marcamos como publicada igual para no dejarla colgada.
      await supabase
        .from('post_publications')
        .update({ status: 'simulated', published_at: now })
        .eq('id', pub.id)
    }
  }

  return Response.json({ published: true, postId }, { status: 200 })
}
