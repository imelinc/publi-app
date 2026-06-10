import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

/**
 * GET /api/notifications
 *
 * Devuelve las últimas 50 notificaciones del usuario autenticado,
 * ordenadas por fecha de creación descendente.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, read, post_id, client_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Mapear snake_case → camelCase para el frontend.
  const notifications = (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    postId: n.post_id,
    clientId: n.client_id,
    createdAt: n.created_at,
  }))

  return Response.json({ data: notifications })
}

/**
 * PATCH /api/notifications
 *
 * Marca todas las notificaciones del usuario como leídas.
 */
export async function PATCH(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
