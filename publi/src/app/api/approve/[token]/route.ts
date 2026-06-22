import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ token: string }>
}

// ─── GET /api/approve/:token ──────────────────────────────────────────────────
/**
 * Endpoint público — no requiere sesión.
 * Devuelve los datos del post para que el cliente final pueda ver el preview
 * antes de aprobar o rechazar.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id,
      description,
      networks,
      hashtags,
      media_urls,
      status,
      scheduled_at,
      client_feedback,
      client_id,
      clients!inner (
        id,
        name,
        color
      )
    `)
    .eq('approval_token', token)
    .single()

  if (error || !post) {
    return Response.json({ error: 'Link de aprobación inválido o expirado' }, { status: 404 })
  }

  // Si el post ya fue procesado (aprobado, rechazado o ya más avanzado), informarlo
  if (!['pending_approval'].includes(post.status)) {
    return Response.json(
      {
        error: 'Este post ya fue procesado',
        status: post.status,
      },
      { status: 409 }
    )
  }

  // Solo devolver los datos necesarios para el preview (sin tokens ni datos internos)
  const client = post.clients as unknown as { id: string; name: string; color: string } | null
  return Response.json({
    data: {
      id: post.id,
      description: post.description,
      networks: post.networks,
      hashtags: post.hashtags,
      mediaUrls: post.media_urls,
      scheduledAt: post.scheduled_at,
      clientName: client?.name ?? '',
      clientColor: client?.color ?? '#0095b6',
    },
  })
}

// ─── POST /api/approve/:token ─────────────────────────────────────────────────
/**
 * Endpoint público — no requiere sesión.
 * El cliente final envía su decisión: { approved: true/false, feedback?: string }
 *
 * Si aprueba → status = 'approved', se guarda approved_at y feedback (opcional)
 * Si rechaza → status = 'draft', se guarda feedback (por qué rechazó)
 *
 * En ambos casos el token se mantiene en la DB para auditoría, pero el post
 * deja de estar en pending_approval, así que el link ya no es "accionable".
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params
  const supabase = createAdminClient()

  const body: { approved: boolean; feedback?: string } = await request.json()

  // Verificar que el token existe y el post sigue pendiente
  const { data: post, error: findErr } = await supabase
    .from('posts')
    .select('id, status')
    .eq('approval_token', token)
    .single()

  if (findErr || !post) {
    return Response.json({ error: 'Link de aprobación inválido o expirado' }, { status: 404 })
  }

  if (post.status !== 'pending_approval') {
    return Response.json(
      { error: 'Este post ya fue procesado', status: post.status },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  const updates = body.approved
    ? {
        status: 'approved',
        approved_at: now,
        client_feedback: body.feedback?.trim() || null,
      }
    : {
        // Rechazo → vuelve a draft para que el CM lo edite y reenvíe
        status: 'draft',
        approved_at: null,
        client_feedback: body.feedback?.trim() || 'El cliente solicitó cambios sin dejar comentarios.',
      }

  const { error: updateErr } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', post.id)

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 })
  }

  return Response.json({
    data: {
      approved: body.approved,
      message: body.approved
        ? '¡Gracias! El post fue aprobado.'
        : 'Gracias por tu feedback. El equipo lo revisará.',
    },
  })
}
