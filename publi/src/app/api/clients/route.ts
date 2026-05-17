import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import type { Network, Plan } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (clientsError) {
    return Response.json({ error: clientsError.message }, { status: 500 })
  }

  const clientIds = clients.map((c: { id: string }) => c.id)

  const { data: postCounts, error: postsError } = await supabase
    .from('posts')
    .select('client_id, status')
    .in('client_id', clientIds.length > 0 ? clientIds : [''])

  if (postsError) {
    return Response.json({ error: postsError.message }, { status: 500 })
  }

  const { data: igAccounts, error: igError } = await supabase
    .from('instagram_accounts')
    .select('client_id')
    .in('client_id', clientIds.length > 0 ? clientIds : [''])

  if (igError) {
    return Response.json({ error: igError.message }, { status: 500 })
  }

  const igSet = new Set(igAccounts.map((a: { client_id: string }) => a.client_id))

  const statsMap = new Map<string, { scheduled: number; drafts: number; published: number }>()
  for (const post of postCounts) {
    const typed = post as { client_id: string; status: string }
    if (!statsMap.has(typed.client_id)) {
      statsMap.set(typed.client_id, { scheduled: 0, drafts: 0, published: 0 })
    }
    const entry = statsMap.get(typed.client_id)!
    if (typed.status === 'scheduled') entry.scheduled++
    else if (typed.status === 'draft') entry.drafts++
    else if (typed.status === 'published') entry.published++
  }

  const result = clients.map((c: { id: string; name: string; color: string; plan: Plan; created_at: string }) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    plan: c.plan,
    createdAt: c.created_at,
    initials: c.name.slice(0, 2).toUpperCase(),
    connectedNetworks: igSet.has(c.id) ? (['instagram'] as Network[]) : ([] as Network[]),
    stats: statsMap.get(c.id) ?? { scheduled: 0, drafts: 0, published: 0 },
  }))

  return Response.json({ data: result }, { status: 200 })
}

interface CreateClientBody {
  name: string
  color: string
  networks?: Network[]
  plan?: Plan
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateClientBody = await request.json()

  if (!body.name || body.name.trim() === '') {
    return Response.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }

  const { data: client, error: insertError } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      color: body.color,
      plan: body.plan ?? 'free',
    })
    .select()
    .single()

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 })
  }

  const result = {
    id: client.id,
    name: client.name,
    color: client.color,
    plan: client.plan,
    createdAt: client.created_at,
    initials: client.name.slice(0, 2).toUpperCase(),
    connectedNetworks: [] as Network[],
    stats: { scheduled: 0, drafts: 0, published: 0 },
  }

  return Response.json({ data: result }, { status: 201 })
}
