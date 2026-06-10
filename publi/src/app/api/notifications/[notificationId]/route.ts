import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ notificationId: string }>
}

/**
 * DELETE /api/notifications/:notificationId
 *
 * Elimina una notificación individual del usuario autenticado.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { notificationId } = await params

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
