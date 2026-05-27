import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ clientId: string; accountId: string }>
}

/**
 * DELETE /api/clients/:clientId/social-accounts/:accountId
 *
 * Desconecta una red social. Las filas históricas en post_publications
 * se mantienen (no hay cascade — social_accounts no es FK de post_publications).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId, accountId } = await params

  // Verificar ownership del cliente
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  // Verificar que la cuenta pertenece a ese cliente antes de borrar
  const { data: account, error: findErr } = await supabase
    .from('social_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('client_id', clientId)
    .single()

  if (findErr || !account) {
    return Response.json({ error: 'Cuenta no encontrada' }, { status: 404 })
  }

  const { error: deleteErr } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', accountId)

  if (deleteErr) {
    return Response.json({ error: deleteErr.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
