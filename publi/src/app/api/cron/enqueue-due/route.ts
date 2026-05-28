import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enqueuePostPublish } from '@/lib/qstash'
import { resolveBaseUrl } from '@/lib/url'

/**
 * GET /api/cron/enqueue-due
 *
 * Cron diario (Vercel) que "barre" hacia QStash las publicaciones programadas
 * que entran en la ventana de 6.5 días y todavía no fueron encoladas
 * (qstash_message_id IS NULL). Resuelve el límite de 7 días del plan free:
 * lo lejano se encola recién cuando se acerca.
 *
 * Protegido por `CRON_SECRET` (Vercel lo manda como Bearer si está configurado).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const windowEnd = new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000)

  const { data: due, error } = await supabase
    .from('posts')
    .select('id, scheduled_at')
    .eq('status', 'scheduled')
    .is('qstash_message_id', null)
    .gt('scheduled_at', now.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = resolveBaseUrl(request)
  let enqueued = 0
  let failed = 0

  for (const post of (due ?? []) as { id: string; scheduled_at: string }[]) {
    try {
      const messageId = await enqueuePostPublish(post.id, post.scheduled_at, baseUrl)
      const { error: updErr } = await supabase
        .from('posts')
        .update({ qstash_message_id: messageId })
        .eq('id', post.id)
      if (updErr) throw new Error(updErr.message)
      enqueued++
    } catch (err) {
      // No abortamos el batch: el próximo barrido reintenta este post.
      console.error(`Error encolando post ${post.id} en el cron:`, err)
      failed++
    }
  }

  return Response.json({ enqueued, failed, scanned: due?.length ?? 0 })
}
