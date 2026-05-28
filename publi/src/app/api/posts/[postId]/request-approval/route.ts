import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { resolveBaseUrl } from '@/lib/url'

interface RouteParams {
  params: Promise<{ postId: string }>
}

/**
 * POST /api/posts/:postId/request-approval
 *
 * Genera un token único de aprobación y cambia el estado del post
 * a "pending_approval". Devuelve la URL pública que el CM puede
 * copiar y enviarle al cliente final.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params

  // Verificar que el post pertenece al usuario
  const { data: post, error: findErr } = await supabase
    .from('posts')
    .select('id, status, client_id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single()

  if (findErr || !post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  // Solo se puede pedir aprobación desde draft o si fue rechazado (volvió a draft)
  if (post.status !== 'draft') {
    return Response.json(
      { error: `No se puede pedir aprobación de un post en estado "${post.status}"` },
      { status: 409 }
    )
  }

  const token = randomUUID()
  const baseUrl = resolveBaseUrl(request)
  const approvalUrl = `${baseUrl}/aprobar/${token}`

  const { error: updateErr } = await supabase
    .from('posts')
    .update({
      status: 'pending_approval',
      approval_token: token,
      // Limpiar feedback anterior si hubo un rechazo previo
      approved_at: null,
      client_feedback: null,
    })
    .eq('id', postId)

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 })
  }

  return Response.json(
    { data: { approvalUrl, token } },
    { status: 200 }
  )
}
