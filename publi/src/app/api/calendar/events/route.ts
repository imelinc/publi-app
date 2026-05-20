import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { EventType } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Obtener IDs de clientes del usuario (para RLS manual)
  let clientQuery = supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)

  if (clientId && clientId !== 'all') {
    clientQuery = clientQuery.eq('id', clientId)
  }

  const { data: clients, error: cErr } = await clientQuery

  if (cErr) return Response.json({ error: cErr.message }, { status: 500 })
  if (!clients || clients.length === 0) return Response.json({ data: [] })

  const clientIds = clients.map((c: { id: string }) => c.id)

  let eventsQuery = supabase
    .from('calendar_events')
    .select('*')
    .in('client_id', clientIds)
    .order('date', { ascending: true })

  if (from) {
    eventsQuery = eventsQuery.gte('date', from)
  }

  if (to) {
    eventsQuery = eventsQuery.lte('date', to)
  }

  const { data: events, error: eErr } = await eventsQuery

  if (eErr) {
    return Response.json({ data: [] })
  }

  const result = (events ?? []).map((e: Record<string, unknown>) => ({
    id: e.id,
    clientId: e.client_id,
    title: (e.title as string) ?? '',
    description: (e.description as string) ?? '',
    type: (e.type as EventType) ?? 'event',
    color: (e.color as string) ?? '#0095b6',
    date: e.date,
  }))

  return Response.json({ data: result })
}

interface CreateEventBody {
  clientId: string
  title: string
  description?: string
  type: EventType
  color?: string
  date: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreateEventBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Validar campos obligatorios
  if (!body.clientId) {
    return Response.json({ error: 'clientId es requerido' }, { status: 400 })
  }
  if (!body.title || body.title.trim() === '') {
    return Response.json({ error: 'El título es requerido' }, { status: 400 })
  }
  if (!body.type || !['event', 'deadline'].includes(body.type)) {
    return Response.json({ error: 'El tipo debe ser "event" o "deadline"' }, { status: 400 })
  }
  if (!body.date) {
    return Response.json({ error: 'La fecha es requerida' }, { status: 400 })
  }

  // Verificar que el cliente pertenece al usuario
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id')
    .eq('id', body.clientId)
    .eq('user_id', user.id)
    .single()

  if (clientErr || !client) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { data: event, error: insertErr } = await supabase
    .from('calendar_events')
    .insert({
      client_id: body.clientId,
      title: body.title.trim(),
      description: body.description ?? '',
      type: body.type,
      color: body.color ?? '#0095b6',
      date: body.date,
    })
    .select()
    .single()

  if (insertErr) {
    return Response.json({ error: insertErr.message }, { status: 500 })
  }

  const result = {
    id: event.id,
    clientId: event.client_id,
    title: event.title ?? '',
    description: event.description ?? '',
    type: (event.type as EventType) ?? 'event',
    color: event.color ?? '#0095b6',
    date: event.date,
  }

  return Response.json({ data: result }, { status: 201 })
}
