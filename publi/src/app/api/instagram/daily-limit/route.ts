import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getDailyUsage } from '@/lib/instagram-rate-limit'

/**
 * GET /api/instagram/daily-limit?clientId=...
 *
 * Devuelve el uso actual de la cuota diaria de Instagram (ventana móvil de 24hs).
 * Requiere sesión autenticada y valida el ownership del cliente.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = request.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return Response.json({ error: 'clientId es requerido' }, { status: 400 })
  }

  // Validar ownership del cliente
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return Response.json({ error: 'Cliente no encontrado o no autorizado' }, { status: 404 })
  }

  try {
    const usage = await getDailyUsage(clientId, supabase)
    return Response.json(usage)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    return Response.json({ error: message }, { status: 500 })
  }
}
