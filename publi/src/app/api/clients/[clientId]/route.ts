import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Network } from '@/types'

interface RouteParams {
  params: Promise<{ clientId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId } = await params

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (clientError || !client) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { data: postCounts } = await supabase
    .from('posts')
    .select('status')
    .eq('client_id', clientId)

  const stats = { scheduled: 0, drafts: 0, published: 0 }
  for (const post of postCounts ?? []) {
    const typed = post as { status: string }
    if (typed.status === 'scheduled') stats.scheduled++
    else if (typed.status === 'draft') stats.drafts++
    else if (typed.status === 'published') stats.published++
  }

  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('network')
    .eq('client_id', clientId)

  const connectedNetworks = (socialAccounts ?? []).map(
    (a: { network: Network }) => a.network
  )

  const result = {
    id: client.id,
    name: client.name,
    description: client.descriptions ?? '',
    color: client.color,
    plan: client.plan,
    createdAt: client.created_at,
    initials: client.name.slice(0, 2).toUpperCase(),
    connectedNetworks,
    stats,
  }

  return Response.json({ data: result }, { status: 200 })
}

interface UpdateClientBody {
  name?: string
  description?: string
  color?: string
  plan?: 'free' | 'pro'
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId } = await params

  const { data: existing, error: findError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (findError || !existing) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const body: UpdateClientBody = await request.json()

  const updates: Record<string, string | null> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.descriptions = body.description || null
  if (body.color !== undefined) updates.color = body.color
  if (body.plan !== undefined) updates.plan = body.plan

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No se enviaron campos para actualizar' }, { status: 400 })
  }

  const { data: client, error: updateError } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  const result = {
    id: client.id,
    name: client.name,
    description: client.descriptions ?? '',
    color: client.color,
    plan: client.plan,
    createdAt: client.created_at,
    initials: client.name.slice(0, 2).toUpperCase(),
  }

  return Response.json({ data: result }, { status: 200 })
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId } = await params

  const { data: existing, error: findError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (findError || !existing) {
    return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', user.id)

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
