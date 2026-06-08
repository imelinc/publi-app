import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyQStashSignature } from '@/lib/qstash'
import { publishPostPublications } from '@/lib/publish-post'

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
 * Delega la publicación al servicio compartido `publishPostPublications`
 * (mismo núcleo que usa "Publicar ahora"). Idempotente: si QStash reintenta,
 * las publicaciones ya resueltas se saltean.
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
  //    200 para que QStash NO reintente.
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

  // 4. Publicar (servicio compartido).
  const result = await publishPostPublications(supabase, postId)
  return Response.json(
    { published: result.status === 'published', results: result.results },
    { status: 200 }
  )
}
