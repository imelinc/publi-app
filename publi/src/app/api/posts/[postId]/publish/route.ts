import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'
import { publishPostPublications } from '@/lib/publish-post'
import { cancelPostPublish } from '@/lib/qstash'

interface RouteParams {
  params: Promise<{ postId: string }>
}

/**
 * POST /api/posts/:postId/publish
 *
 * Publica YA un post en sus redes (real en Instagram, simulado en el resto),
 * reutilizando el mismo servicio que usa el scheduling. Es el camino de
 * "Publicar ahora".
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params

  // Ownership: posts tiene user_id directo.
  const { data: post, error: findErr } = await supabase
    .from('posts')
    .select('id, status, qstash_message_id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (findErr || !post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  // No re-publicar lo ya publicado/fallido.
  const publishable = ['draft', 'approved', 'pending_approval', 'scheduled']
  if (!publishable.includes(post.status as string)) {
    return Response.json(
      { error: `No se puede publicar un post en estado "${post.status}"` },
      { status: 409 }
    )
  }

  // Si estaba programado, cancelar el job de QStash para que no se duplique
  // al llegar la fecha original.
  if (post.qstash_message_id) {
    try {
      await cancelPostPublish(post.qstash_message_id as string)
    } catch (err) {
      console.error('[posts/publish] no se pudo cancelar el job de QStash:', err)
    }
  }

  // Publicar con admin client (lee access_token y escribe sin fricción de RLS;
  // ya validamos el ownership arriba).
  const result = await publishPostPublications(createAdminClient(), postId)

  return Response.json(result, { status: 200 })
}
