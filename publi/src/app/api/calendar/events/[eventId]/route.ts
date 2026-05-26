import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { EventType } from '@/types'

interface RouteParams {
  params: Promise<{ eventId: string }>
}

// ─── Utilidad: verificar ownership del evento ────────────────────────────────

async function getOwnedEvent(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
  // Busca el evento y verifica que pertenece a un cliente del usuario
  const { data: event, error } = await supabase
    .from('calendar_events')
    .select('*, clients!inner(user_id)')
    .eq('id', eventId)
    .single()

  if (error || !event) return null

  // Verificar ownership a través del cliente
  const clientData = event.clients as { user_id: string } | null
  if (!clientData || clientData.user_id !== userId) return null

  return event
}

// ─── GET /api/calendar/events/:eventId ───────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId } = await params
  const event = await getOwnedEvent(supabase, eventId, user.id)

  if (!event) {
    return Response.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  const isAllDay = (event.is_all_day as boolean | null) ?? true
  return Response.json({
    data: {
      id: event.id,
      clientId: event.client_id,
      title: event.title ?? '',
      description: event.description ?? '',
      type: (event.type as EventType) ?? 'event',
      color: event.color ?? '#0095b6',
      date: isAllDay
        ? (event.date as string ?? '').split('T')[0]
        : (event.date as string ?? ''),
      endAt: (event.end_at as string | null) ?? null,
      isAllDay,
    },
  })
}

// ─── PATCH /api/calendar/events/:eventId ─────────────────────────────────────

interface UpdateEventBody {
  title?: string
  description?: string
  type?: EventType
  color?: string
  date?: string
  endAt?: string | null
  isAllDay?: boolean
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId } = await params
  const existing = await getOwnedEvent(supabase, eventId, user.id)

  if (!existing) {
    return Response.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  let body: UpdateEventBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Validar tipo si se envía
  if (body.type && !['event', 'deadline'].includes(body.type)) {
    return Response.json({ error: 'El tipo debe ser "event" o "deadline"' }, { status: 400 })
  }

  // Validar título si se envía
  if (body.title !== undefined && body.title.trim() === '') {
    return Response.json({ error: 'El título no puede estar vacío' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description
  if (body.type !== undefined) updates.type = body.type
  if (body.color !== undefined) updates.color = body.color
  if (body.date !== undefined) updates.date = body.date
  if (body.endAt !== undefined) updates.end_at = body.endAt
  if (body.isAllDay !== undefined) {
    updates.is_all_day = body.isAllDay
    // Si se marca como all-day, limpiar end_at automáticamente
    if (body.isAllDay) updates.end_at = null
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const { data: updated, error: updateErr } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 })
  }

  const updatedIsAllDay = (updated.is_all_day as boolean | null) ?? true
  return Response.json({
    data: {
      id: updated.id,
      clientId: updated.client_id,
      title: updated.title ?? '',
      description: updated.description ?? '',
      type: (updated.type as EventType) ?? 'event',
      color: updated.color ?? '#0095b6',
      date: updatedIsAllDay
        ? (updated.date as string ?? '').split('T')[0]
        : (updated.date as string ?? ''),
      endAt: (updated.end_at as string | null) ?? null,
      isAllDay: updatedIsAllDay,
    },
  })
}

// ─── DELETE /api/calendar/events/:eventId ────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId } = await params
  const existing = await getOwnedEvent(supabase, eventId, user.id)

  if (!existing) {
    return Response.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  const { error: deleteErr } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)

  if (deleteErr) {
    return Response.json({ error: deleteErr.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
