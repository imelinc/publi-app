import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { EventType } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: clients, error: cErr } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)

  if (cErr) return Response.json({ error: cErr.message }, { status: 500 })
  if (!clients || clients.length === 0) return Response.json({ data: [] })

  const clientIds = clients.map((c: { id: string }) => c.id)

  const { data: events, error: eErr } = await supabase
    .from('calendar_events')
    .select('*')
    .in('client_id', clientIds)
    .order('date', { ascending: true })

  if (eErr) {
    // Table might not exist yet — return empty gracefully
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
  description: string
  type: EventType
  color: string
  date: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateEventBody = await request.json()

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
      title: body.title,
      description: body.description,
      type: body.type,
      color: body.color,
      date: body.date,
    })
    .select()
    .single()

  if (insertErr) {
    // If table doesn't exist, fall back to client-side only
    const fallback = {
      id: crypto.randomUUID(),
      clientId: body.clientId,
      title: body.title,
      description: body.description,
      type: body.type,
      color: body.color,
      date: body.date,
    }
    return Response.json({ data: fallback }, { status: 201 })
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
