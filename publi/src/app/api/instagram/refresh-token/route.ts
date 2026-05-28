import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refreshLongLived } from '@/lib/instagram'

/**
 * GET /api/instagram/refresh-token
 *
 * Cron diario (Vercel) que mantiene vivos los tokens long-lived de Instagram:
 * refresca los que vencen en menos de 10 días. Así el token persiste sin que el
 * CM tenga que re-loguear. Protegido por CRON_SECRET (mismo patrón que
 * /api/cron/enqueue-due).
 *
 * Nota: Meta sólo permite refrescar tokens con >24h de vida y no vencidos. Los
 * que ya expiraron requieren reconexión manual (no se pueden refrescar).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const threshold = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { data: accounts, error } = await supabase
    .from('social_accounts')
    .select('id, access_token, token_expires_at')
    .eq('network', 'instagram')
    .eq('is_simulated', false)
    .not('access_token', 'is', null)
    .lt('token_expires_at', threshold)
    .gt('token_expires_at', now)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  let refreshed = 0
  let failed = 0

  for (const acc of (accounts ?? []) as {
    id: string
    access_token: string
    token_expires_at: string
  }[]) {
    try {
      const result = await refreshLongLived(acc.access_token)
      const expiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString()
      const { error: updErr } = await supabase
        .from('social_accounts')
        .update({ access_token: result.accessToken, token_expires_at: expiresAt })
        .eq('id', acc.id)
      if (updErr) throw new Error(updErr.message)
      refreshed++
    } catch (err) {
      console.error(`[instagram/refresh-token] falló refrescar cuenta ${acc.id}:`, err)
      failed++
    }
  }

  return Response.json({ refreshed, failed, scanned: accounts?.length ?? 0 })
}
